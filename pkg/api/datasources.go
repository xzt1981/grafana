package api

import (
	"sort"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/util"
)

func GetDataSources(c *m.ReqContext) Response {
	query := m.GetDataSourcesQuery{OrgId: c.OrgId}

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "查询数据源失败", err)
	}

	result := make(dtos.DataSourceList, 0)
	for _, ds := range query.Result {
		dsItem := dtos.DataSourceListItemDTO{
			Id:        ds.Id,
			OrgId:     ds.OrgId,
			Name:      ds.Name,
			Url:       ds.Url,
			Type:      ds.Type,
			Access:    ds.Access,
			Password:  ds.Password,
			Database:  ds.Database,
			User:      ds.User,
			BasicAuth: ds.BasicAuth,
			IsDefault: ds.IsDefault,
			JsonData:  ds.JsonData,
			ReadOnly:  ds.ReadOnly,
		}

		if plugin, exists := plugins.DataSources[ds.Type]; exists {
			dsItem.TypeLogoUrl = plugin.Info.Logos.Small
		} else {
			dsItem.TypeLogoUrl = "public/img/icn-datasource.svg"
		}

		result = append(result, dsItem)
	}

	sort.Sort(result)

	return JSON(200, &result)
}

func GetDataSourceByID(c *m.ReqContext) Response {
	query := m.GetDataSourceByIdQuery{
		Id:    c.ParamsInt64(":id"),
		OrgId: c.OrgId,
	}

	if err := bus.Dispatch(&query); err != nil {
		if err == m.ErrDataSourceNotFound {
			return Error(404, "数据源没有找到", nil)
		}
		return Error(500, "查询数据源失败", err)
	}

	ds := query.Result
	dtos := convertModelToDtos(ds)

	return JSON(200, &dtos)
}

func DeleteDataSourceByID(c *m.ReqContext) Response {
	id := c.ParamsInt64(":id")

	if id <= 0 {
		return Error(400, "没有指定有效的数据源ID", nil)
	}

	ds, err := getRawDataSourceByID(id, c.OrgId)
	if err != nil {
		return Error(400, "删除数据源失败", nil)
	}

	if ds.ReadOnly {
		return Error(403, "不能删除只读数据源", nil)
	}

	cmd := &m.DeleteDataSourceByIdCommand{Id: id, OrgId: c.OrgId}

	err = bus.Dispatch(cmd)
	if err != nil {
		return Error(500, "删除数据员失败", err)
	}

	return Success("数据源删除成功")
}

func DeleteDataSourceByName(c *m.ReqContext) Response {
	name := c.Params(":name")

	if name == "" {
		return Error(400, "没有指定有效的数据源名字", nil)
	}

	getCmd := &m.GetDataSourceByNameQuery{Name: name, OrgId: c.OrgId}
	if err := bus.Dispatch(getCmd); err != nil {
		if err == m.ErrDataSourceNotFound {
			return Error(404, "没有找到数据源", nil)
		}
		return Error(500, "删除数据源失败", err)
	}

	if getCmd.Result.ReadOnly {
		return Error(403, "不能删除只读数据源", nil)
	}

	cmd := &m.DeleteDataSourceByNameCommand{Name: name, OrgId: c.OrgId}
	err := bus.Dispatch(cmd)
	if err != nil {
		return Error(500, "数据源删除失败", err)
	}

	return Success("数据源删除成功")
}

func AddDataSource(c *m.ReqContext, cmd m.AddDataSourceCommand) Response {
	cmd.OrgId = c.OrgId

	if err := bus.Dispatch(&cmd); err != nil {
		if err == m.ErrDataSourceNameExists {
			return Error(409, err.Error(), err)
		}

		return Error(500, "数据源添加失败", err)
	}

	ds := convertModelToDtos(cmd.Result)
	return JSON(200, util.DynMap{
		"message":    "数据源添加成功",
		"id":         cmd.Result.Id,
		"name":       cmd.Result.Name,
		"datasource": ds,
	})
}

func UpdateDataSource(c *m.ReqContext, cmd m.UpdateDataSourceCommand) Response {
	cmd.OrgId = c.OrgId
	cmd.Id = c.ParamsInt64(":id")

	err := fillWithSecureJSONData(&cmd)
	if err != nil {
		return Error(500, "更新数据源失败", err)
	}

	err = bus.Dispatch(&cmd)
	if err != nil {
		if err == m.ErrDataSourceUpdatingOldVersion {
			return Error(500, "更新数据源失败， 请加载新版本重试", err)
		}
		return Error(500, "更新数据源失败", err)
	}
	ds := convertModelToDtos(cmd.Result)
	return JSON(200, util.DynMap{
		"message":    "数据源已保存",
		"id":         cmd.Id,
		"name":       cmd.Name,
		"datasource": ds,
	})
}

func fillWithSecureJSONData(cmd *m.UpdateDataSourceCommand) error {
	if len(cmd.SecureJsonData) == 0 {
		return nil
	}

	ds, err := getRawDataSourceByID(cmd.Id, cmd.OrgId)
	if err != nil {
		return err
	}

	if ds.ReadOnly {
		return m.ErrDatasourceIsReadOnly
	}

	secureJSONData := ds.SecureJsonData.Decrypt()
	for k, v := range secureJSONData {

		if _, ok := cmd.SecureJsonData[k]; !ok {
			cmd.SecureJsonData[k] = v
		}
	}

	return nil
}

func getRawDataSourceByID(id int64, orgID int64) (*m.DataSource, error) {
	query := m.GetDataSourceByIdQuery{
		Id:    id,
		OrgId: orgID,
	}

	if err := bus.Dispatch(&query); err != nil {
		return nil, err
	}

	return query.Result, nil
}

// Get /api/datasources/name/:name
func GetDataSourceByName(c *m.ReqContext) Response {
	query := m.GetDataSourceByNameQuery{Name: c.Params(":name"), OrgId: c.OrgId}

	if err := bus.Dispatch(&query); err != nil {
		if err == m.ErrDataSourceNotFound {
			return Error(404, "没有找到数据源", nil)
		}
		return Error(500, "查询数据源失败", err)
	}

	dtos := convertModelToDtos(query.Result)
	dtos.ReadOnly = true
	return JSON(200, &dtos)
}

// Get /api/datasources/id/:name
func GetDataSourceIDByName(c *m.ReqContext) Response {
	query := m.GetDataSourceByNameQuery{Name: c.Params(":name"), OrgId: c.OrgId}

	if err := bus.Dispatch(&query); err != nil {
		if err == m.ErrDataSourceNotFound {
			return Error(404, "没有找到数据源", nil)
		}
		return Error(500, "查询数据源失败", err)
	}

	ds := query.Result
	dtos := dtos.AnyId{
		Id: ds.Id,
	}

	return JSON(200, &dtos)
}

func convertModelToDtos(ds *m.DataSource) dtos.DataSource {
	dto := dtos.DataSource{
		Id:                ds.Id,
		OrgId:             ds.OrgId,
		Name:              ds.Name,
		Url:               ds.Url,
		Type:              ds.Type,
		Access:            ds.Access,
		Password:          ds.Password,
		Database:          ds.Database,
		User:              ds.User,
		BasicAuth:         ds.BasicAuth,
		BasicAuthUser:     ds.BasicAuthUser,
		BasicAuthPassword: ds.BasicAuthPassword,
		WithCredentials:   ds.WithCredentials,
		IsDefault:         ds.IsDefault,
		JsonData:          ds.JsonData,
		SecureJsonFields:  map[string]bool{},
		Version:           ds.Version,
		ReadOnly:          ds.ReadOnly,
	}

	for k, v := range ds.SecureJsonData {
		if len(v) > 0 {
			dto.SecureJsonFields[k] = true
		}
	}

	return dto
}
