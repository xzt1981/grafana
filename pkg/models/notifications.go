package models

import "errors"

var ErrInvalidEmailCode = errors.New("无效或者过期的邮箱验证码")
var ErrSmtpNotEnabled = errors.New("SMTP没有配置, 请检查配置文件中的[smtp]段。")

type SendEmailCommand struct {
	To           []string
	Template     string
	Subject      string
	Data         map[string]interface{}
	Info         string
	EmbededFiles []string
}

type SendEmailCommandSync struct {
	SendEmailCommand
}

type SendWebhookSync struct {
	Url         string
	User        string
	Password    string
	Body        string
	HttpMethod  string
	HttpHeader  map[string]string
	ContentType string
}

type SendResetPasswordEmailCommand struct {
	User *User
}

type ValidateResetPasswordCodeQuery struct {
	Code   string
	Result *User
}
