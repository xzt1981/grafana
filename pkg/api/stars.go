package api

import (
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
)

func StarDashboard(c *m.ReqContext) Response {
	if !c.IsSignedIn {
		return Error(412, "登录后才可以收藏仪表盘", nil)
	}

	cmd := m.StarDashboardCommand{UserId: c.UserId, DashboardId: c.ParamsInt64(":id")}

	if cmd.DashboardId <= 0 {
		return Error(400, "仪表盘id丢失", nil)
	}

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "收藏失败", err)
	}

	return Success("已收藏!")
}

func UnstarDashboard(c *m.ReqContext) Response {

	cmd := m.UnstarDashboardCommand{UserId: c.UserId, DashboardId: c.ParamsInt64(":id")}

	if cmd.DashboardId <= 0 {
		return Error(400, "仪表盘id丢失", nil)
	}

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "F取消收藏失败", err)
	}

	return Success("取消收藏")
}
