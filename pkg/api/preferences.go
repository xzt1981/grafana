package api

import (
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
)

// POST /api/preferences/set-home-dash
func SetHomeDashboard(c *m.ReqContext, cmd m.SavePreferencesCommand) Response {

	cmd.UserId = c.UserId
	cmd.OrgId = c.OrgId

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "设置我的仪表盘失败", err)
	}

	return Success("我的仪表盘设置成功")
}

// GET /api/user/preferences
func GetUserPreferences(c *m.ReqContext) Response {
	return getPreferencesFor(c.OrgId, c.UserId)
}

func getPreferencesFor(orgID int64, userID int64) Response {
	prefsQuery := m.GetPreferencesQuery{UserId: userID, OrgId: orgID}

	if err := bus.Dispatch(&prefsQuery); err != nil {
		return Error(500, "获取个性化配置失败", err)
	}

	dto := dtos.Prefs{
		Theme:           prefsQuery.Result.Theme,
		HomeDashboardID: prefsQuery.Result.HomeDashboardId,
		Timezone:        prefsQuery.Result.Timezone,
	}

	return JSON(200, &dto)
}

// PUT /api/user/preferences
func UpdateUserPreferences(c *m.ReqContext, dtoCmd dtos.UpdatePrefsCmd) Response {
	return updatePreferencesFor(c.OrgId, c.UserId, &dtoCmd)
}

func updatePreferencesFor(orgID int64, userID int64, dtoCmd *dtos.UpdatePrefsCmd) Response {
	saveCmd := m.SavePreferencesCommand{
		UserId:          userID,
		OrgId:           orgID,
		Theme:           dtoCmd.Theme,
		Timezone:        dtoCmd.Timezone,
		HomeDashboardId: dtoCmd.HomeDashboardID,
	}

	if err := bus.Dispatch(&saveCmd); err != nil {
		return Error(500, "保存失败", err)
	}

	return Success("保存成功")
}

// GET /api/org/preferences
func GetOrgPreferences(c *m.ReqContext) Response {
	return getPreferencesFor(c.OrgId, 0)
}

// PUT /api/org/preferences
func UpdateOrgPreferences(c *m.ReqContext, dtoCmd dtos.UpdatePrefsCmd) Response {
	return updatePreferencesFor(c.OrgId, 0, &dtoCmd)
}
