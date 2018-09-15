package api

import (
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/metrics"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/util"
)

func AdminCreateUser(c *m.ReqContext, form dtos.AdminCreateUserForm) {
	cmd := m.CreateUserCommand{
		Login:    form.Login,
		Email:    form.Email,
		Password: form.Password,
		Name:     form.Name,
	}

	if len(cmd.Login) == 0 {
		cmd.Login = cmd.Email
		if len(cmd.Login) == 0 {
			c.JsonApiErr(400, "验证失败，需要指定用户名或者邮箱", nil)
			return
		}
	}

	if len(cmd.Password) < 4 {
		c.JsonApiErr(400, "未设置密码或者密码太短", nil)
		return
	}

	if err := bus.Dispatch(&cmd); err != nil {
		c.JsonApiErr(500, "添加用户失败", err)
		return
	}

	metrics.M_Api_Admin_User_Create.Inc()

	user := cmd.Result

	result := m.UserIdDTO{
		Message: "用户已添加",
		Id:      user.Id,
	}

	c.JSON(200, result)
}

func AdminUpdateUserPassword(c *m.ReqContext, form dtos.AdminUpdateUserPasswordForm) {
	userID := c.ParamsInt64(":id")

	if len(form.Password) < 4 {
		c.JsonApiErr(400, "新密码太短", nil)
		return
	}

	userQuery := m.GetUserByIdQuery{Id: userID}

	if err := bus.Dispatch(&userQuery); err != nil {
		c.JsonApiErr(500, "读取用户失败", err)
		return
	}

	passwordHashed := util.EncodePassword(form.Password, userQuery.Result.Salt)

	cmd := m.ChangeUserPasswordCommand{
		UserId:      userID,
		NewPassword: passwordHashed,
	}

	if err := bus.Dispatch(&cmd); err != nil {
		c.JsonApiErr(500, "更新密码失败", err)
		return
	}

	c.JsonOK("密码修改成功")
}

func AdminUpdateUserPermissions(c *m.ReqContext, form dtos.AdminUpdateUserPermissionsForm) {
	userID := c.ParamsInt64(":id")

	cmd := m.UpdateUserPermissionsCommand{
		UserId:         userID,
		IsGrafanaAdmin: form.IsGrafanaAdmin,
	}

	if err := bus.Dispatch(&cmd); err != nil {
		c.JsonApiErr(500, "用户权限保存失败", err)
		return
	}

	c.JsonOK("用户权限保存成功")
}

func AdminDeleteUser(c *m.ReqContext) {
	userID := c.ParamsInt64(":id")

	cmd := m.DeleteUserCommand{UserId: userID}

	if err := bus.Dispatch(&cmd); err != nil {
		c.JsonApiErr(500, "删除用户失败", err)
		return
	}

	c.JsonOK("用户删除成功")
}
