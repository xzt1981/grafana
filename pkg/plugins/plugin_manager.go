package plugins

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/log"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

var (
	DataSources  map[string]*DataSourcePlugin
	Panels       map[string]*PanelPlugin
	StaticRoutes []*PluginStaticRoute
	Apps         map[string]*AppPlugin
	Plugins      map[string]*PluginBase
	Renderer     *RendererPlugin

	GrafanaLatestVersion string
	GrafanaHasUpdate     bool
	plog                 log.Logger
)

type PluginScanner struct {
	pluginPath string
	errors     []error
}

type PluginManager struct {
	log log.Logger
}

func init() {
	registry.RegisterService(&PluginManager{})

	// TODO: move thee to PluginManager instance
	plog = log.New("plugins")
	DataSources = map[string]*DataSourcePlugin{}
	StaticRoutes = []*PluginStaticRoute{}
	Panels = map[string]*PanelPlugin{}
	Apps = map[string]*AppPlugin{}
	Plugins = map[string]*PluginBase{}
}

func (pm *PluginManager) Init() error {
	pm.log = log.New("plugins")

	pm.log.Info("Starting plugin search")
	pm.scanForPlugins(path.Join(setting.StaticRootPath, "app/plugins"))

	// check if plugins dir exists
	if _, err := os.Stat(setting.PluginsPath); os.IsNotExist(err) {
		if err = os.MkdirAll(setting.PluginsPath, os.ModePerm); err != nil {
			pm.log.Error("Failed to create plugin dir", "dir", setting.PluginsPath, "error", err)
		} else {
			pm.log.Info("Plugin dir created", "dir", setting.PluginsPath)
			pm.scanForPlugins(setting.PluginsPath)
		}
	} else {
		pm.scanForPlugins(setting.PluginsPath)
	}

	pm.scanSpecificPluginPaths()

	for _, panel := range Panels {
		panel.initFrontendPlugin()
	}

	for _, ds := range DataSources {
		ds.initFrontendPlugin()
	}

	for _, app := range Apps {
		app.initApp()
	}

	return nil
}

func (pm *PluginManager) startBackendPlugins(ctx context.Context) error {
	for _, ds := range DataSources {
		if ds.Backend {
			if err := ds.startBackendPlugin(ctx, plog); err != nil {
				pm.log.Error("Failed to init plugin.", "error", err, "plugin", ds.Id)
			}
		}
	}

	return nil
}

func (pm *PluginManager) Run(ctx context.Context) error {
	pm.startBackendPlugins(ctx)
	pm.updateAppDashboards()
	pm.checkForUpdates()

	ticker := time.NewTicker(time.Minute * 10)
	run := true

	for run {
		select {
		case <-ticker.C:
			pm.checkForUpdates()
		case <-ctx.Done():
			run = false
			break
		}
	}

	// kil backend plugins
	for _, p := range DataSources {
		p.Kill()
	}

	return ctx.Err()
}

func (pm *PluginManager) scanSpecificPluginPaths() error {
	for _, section := range setting.Raw.Sections() {
		if strings.HasPrefix(section.Name(), "plugin.") {
			path := section.Key("path").String()
			if path != "" {
				pm.scanForPlugins(path)
			}
		}
	}
	return nil
}

func (pm *PluginManager) scanForPlugins(pluginDir string) {
	if err := util.Walk(pluginDir, true, true, pm.walker); err != nil {
		if pluginDir != "data/plugins" {
			pm.log.Warn("Could not scan dir \"%v\" error: %s", pluginDir, err)
		}
	}
}

func (pm *PluginManager) walker(currentPath string, f os.FileInfo, err error) error {
	if err != nil {
		return err
	}

	if f.Name() == "node_modules" {
		return util.WalkSkipDir
	}

	if f.IsDir() {
		return nil
	}

	if f.Name() == "plugin.json" {
		err := pm.loadPluginJson(currentPath)
		if err != nil {
			pm.log.Error("Error loading plugin.json", "file", currentPath, "error", err)
		}
	}

	return nil
}

func (pm *PluginManager) loadPluginJson(pluginJsonFilePath string) error {
	currentDir := filepath.Dir(pluginJsonFilePath)
	reader, err := os.Open(pluginJsonFilePath)
	if err != nil {
		return err
	}

	defer reader.Close()

	jsonParser := json.NewDecoder(reader)
	pluginCommon := PluginBase{}
	if err := jsonParser.Decode(&pluginCommon); err != nil {
		return err
	}

	if pluginCommon.Id == "" || pluginCommon.Type == "" {
		return errors.New("Did not find type and id property in plugin.json")
	}

	var loader ModelLoader
	typeDescriptor, exists := PluginTypes[pluginCommon.Type]
	if !exists {
		return errors.New("Unknown plugin type " + pluginCommon.Type)
	}

	loader = reflect.New(reflect.TypeOf(typeDescriptor.PluginModel)).Interface().(ModelLoader)

	reader.Seek(0, 0)

	return loader.Load(jsonParser, currentDir)
}

func GetPluginMarkdown(pluginId string, name string) ([]byte, error) {
	plug, exists := Plugins[pluginId]
	if !exists {
		return nil, PluginNotFoundError{pluginId}
	}

	path := filepath.Join(plug.PluginDir, fmt.Sprintf("%s.md", strings.ToUpper(name)))
	if _, err := os.Stat(path); os.IsNotExist(err) {
		path = filepath.Join(plug.PluginDir, fmt.Sprintf("%s.md", strings.ToLower(name)))
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		return make([]byte, 0), nil
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return data, nil
}