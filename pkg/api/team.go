package api

import (
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/util"
)

// POST /api/teams
func CreateTeam(c *m.ReqContext, cmd m.CreateTeamCommand) Response {
	cmd.OrgId = c.OrgId
	if err := bus.Dispatch(&cmd); err != nil {
		if err == m.ErrTeamNameTaken {
			return Error(409, "用户名已存在", err)
		}
		return Error(500, "创建用户组失败", err)
	}

	return JSON(200, &util.DynMap{
		"teamId":  cmd.Result.Id,
		"message": "用户组创建成功",
	})
}

// PUT /api/teams/:teamId
func UpdateTeam(c *m.ReqContext, cmd m.UpdateTeamCommand) Response {
	cmd.OrgId = c.OrgId
	cmd.Id = c.ParamsInt64(":teamId")
	if err := bus.Dispatch(&cmd); err != nil {
		if err == m.ErrTeamNameTaken {
			return Error(400, "用户组已存在", err)
		}
		return Error(500, "用户组更新失败", err)
	}

	return Success("用户组已更新")
}

// DELETE /api/teams/:teamId
func DeleteTeamByID(c *m.ReqContext) Response {
	if err := bus.Dispatch(&m.DeleteTeamCommand{OrgId: c.OrgId, Id: c.ParamsInt64(":teamId")}); err != nil {
		if err == m.ErrTeamNotFound {
			return Error(404, "删除用户组失败，用户组ID不存在", nil)
		}
		return Error(500, "用户组删除失败", err)
	}
	return Success("用户组已删除")
}

// GET /api/teams/search
func SearchTeams(c *m.ReqContext) Response {
	perPage := c.QueryInt("perpage")
	if perPage <= 0 {
		perPage = 1000
	}
	page := c.QueryInt("page")
	if page < 1 {
		page = 1
	}

	query := m.SearchTeamsQuery{
		OrgId: c.OrgId,
		Query: c.Query("query"),
		Name:  c.Query("name"),
		Page:  page,
		Limit: perPage,
	}

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "没有找到用户组", err)
	}

	for _, team := range query.Result.Teams {
		team.AvatarUrl = dtos.GetGravatarUrlWithDefault(team.Email, team.Name)
	}

	query.Result.Page = page
	query.Result.PerPage = perPage

	return JSON(200, query.Result)
}

// GET /api/teams/:teamId
func GetTeamByID(c *m.ReqContext) Response {
	query := m.GetTeamByIdQuery{OrgId: c.OrgId, Id: c.ParamsInt64(":teamId")}

	if err := bus.Dispatch(&query); err != nil {
		if err == m.ErrTeamNotFound {
			return Error(404, "没有找到用户组", err)
		}

		return Error(500, "获取用户组失败", err)
	}

	query.Result.AvatarUrl = dtos.GetGravatarUrlWithDefault(query.Result.Email, query.Result.Name)
	return JSON(200, &query.Result)
}
