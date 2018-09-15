package api

import (
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/util"
)

func SendResetPasswordEmail(c *m.ReqContext, form dtos.SendResetPasswordEmailForm) Response {
	userQuery := m.GetUserByLoginQuery{LoginOrEmail: form.UserOrEmail}

	if err := bus.Dispatch(&userQuery); err != nil {
		c.Logger.Info("请求重置密码的用户不存在", "user", userQuery.LoginOrEmail)
		return Error(200, "重置密码邮件已发送", err)
	}

	emailCmd := m.SendResetPasswordEmailCommand{User: userQuery.Result}
	if err := bus.Dispatch(&emailCmd); err != nil {
		return Error(500, "发送邮件失败", err)
	}

	return Success("重置密码邮件已发送")
}

func ResetPassword(c *m.ReqContext, form dtos.ResetUserPasswordForm) Response {
	query := m.ValidateResetPasswordCodeQuery{Code: form.Code}

	if err := bus.Dispatch(&query); err != nil {
		if err == m.ErrInvalidEmailCode {
			return Error(400, "无效或者过期的邮箱重置码", nil)
		}
		return Error(500, "邮箱验证码错误", err)
	}

	if form.NewPassword != form.ConfirmPassword {
		return Error(400, "密码不匹配", nil)
	}

	cmd := m.ChangeUserPasswordCommand{}
	cmd.UserId = query.Result.Id
	cmd.NewPassword = util.EncodePassword(form.NewPassword, query.Result.Salt)

	if err := bus.Dispatch(&cmd); err != nil {
		return Error(500, "修改用户名失败", err)
	}

	return Success("用户名已修改")
}
