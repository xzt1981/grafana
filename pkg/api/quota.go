package api

import (
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
)

func GetOrgQuotas(c *m.ReqContext) Response {
	if !setting.Quota.Enabled {
		return Error(404, "禁止配额", nil)
	}
	query := m.GetOrgQuotasQuery{OrgId: c.ParamsInt64(":orgId")}

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "获取配额失败", err)
	}

	return JSON(200, query.Result)
}

func UpdateOrgQuota(c *m.ReqContext, cmd m.UpdateOrgQuotaCmd) Response {
	if !setting.Quota.Enabled {
		return Error(404, "禁止配额", nil)
	}
	cmd.OrgId = c.ParamsInt64(":orgId")
	cmd.Target = c.Params(":target")

	if _, ok := setting.Quota.Org.ToMap()[cmd.Target]; !ok {
		return Error(404, "配额目标无效", nil)
	}

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "更新机构配额失败", err)
	}
	return Success("机构配额更新成功")
}

func GetUserQuotas(c *m.ReqContext) Response {
	if !setting.Quota.Enabled {
		return Error(404, "禁止配额", nil)
	}
	query := m.GetUserQuotasQuery{UserId: c.ParamsInt64(":id")}

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "获取机构配额失败", err)
	}

	return JSON(200, query.Result)
}

func UpdateUserQuota(c *m.ReqContext, cmd m.UpdateUserQuotaCmd) Response {
	if !setting.Quota.Enabled {
		return Error(404, "禁止配额", nil)
	}
	cmd.UserId = c.ParamsInt64(":id")
	cmd.Target = c.Params(":target")

	if _, ok := setting.Quota.User.ToMap()[cmd.Target]; !ok {
		return Error(404, "无效的配额目标", nil)
	}

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "更新机构配额失败", err)
	}
	return Success("机构配额更新成功")
}
