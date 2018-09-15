package api

import (
	"strings"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/components/simplejson"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/annotations"
	"github.com/grafana/grafana/pkg/services/guardian"
	"github.com/grafana/grafana/pkg/util"
)

func GetAnnotations(c *m.ReqContext) Response {

	query := &annotations.ItemQuery{
		From:        c.QueryInt64("from"),
		To:          c.QueryInt64("to"),
		OrgId:       c.OrgId,
		UserId:      c.QueryInt64("userId"),
		AlertId:     c.QueryInt64("alertId"),
		DashboardId: c.QueryInt64("dashboardId"),
		PanelId:     c.QueryInt64("panelId"),
		Limit:       c.QueryInt64("limit"),
		Tags:        c.QueryStrings("tags"),
		Type:        c.Query("type"),
	}

	repo := annotations.GetRepository()

	items, err := repo.Find(query)
	if err != nil {
		return Error(500, "获取注释失败", err)
	}

	for _, item := range items {
		if item.Email != "" {
			item.AvatarUrl = dtos.GetGravatarUrl(item.Email)
		}
	}

	return JSON(200, items)
}

type CreateAnnotationError struct {
	message string
}

func (e *CreateAnnotationError) Error() string {
	return e.message
}

func PostAnnotation(c *m.ReqContext, cmd dtos.PostAnnotationsCmd) Response {
	if canSave, err := canSaveByDashboardID(c, cmd.DashboardId); err != nil || !canSave {
		return dashboardGuardianResponse(err)
	}

	repo := annotations.GetRepository()

	if cmd.Text == "" {
		err := &CreateAnnotationError{"text field should not be empty"}
		return Error(500, "保存注释失败", err)
	}

	item := annotations.Item{
		OrgId:       c.OrgId,
		UserId:      c.UserId,
		DashboardId: cmd.DashboardId,
		PanelId:     cmd.PanelId,
		Epoch:       cmd.Time,
		Text:        cmd.Text,
		Data:        cmd.Data,
		Tags:        cmd.Tags,
	}

	if err := repo.Save(&item); err != nil {
		return Error(500, "保存注释失败", err)
	}

	startID := item.Id

	// handle regions
	if cmd.IsRegion {
		item.RegionId = startID

		if item.Data == nil {
			item.Data = simplejson.New()
		}

		if err := repo.Update(&item); err != nil {
			return Error(500, "在注释上设置区域ID失败", err)
		}

		item.Id = 0
		item.Epoch = cmd.TimeEnd

		if err := repo.Save(&item); err != nil {
			return Error(500, "保存注释的区域和时间信息失败", err)
		}

		return JSON(200, util.DynMap{
			"message": "注释添加成功",
			"id":      startID,
			"endId":   item.Id,
		})
	}

	return JSON(200, util.DynMap{
		"message": "注释添加成功",
		"id":      startID,
	})
}

func formatGraphiteAnnotation(what string, data string) string {
	text := what
	if data != "" {
		text = text + "\n" + data
	}
	return text
}

func PostGraphiteAnnotation(c *m.ReqContext, cmd dtos.PostGraphiteAnnotationsCmd) Response {
	repo := annotations.GetRepository()

	if cmd.What == "" {
		err := &CreateAnnotationError{"'是什么'字段不能为空"}
		return Error(500, "保存Grahpite注释失败", err)
	}

	text := formatGraphiteAnnotation(cmd.What, cmd.Data)

	// Support tags in prior to Graphite 0.10.0 format (string of tags separated by space)
	var tagsArray []string
	switch tags := cmd.Tags.(type) {
	case string:
		if tags != "" {
			tagsArray = strings.Split(tags, " ")
		} else {
			tagsArray = []string{}
		}
	case []interface{}:
		for _, t := range tags {
			if tagStr, ok := t.(string); ok {
				tagsArray = append(tagsArray, tagStr)
			} else {
				err := &CreateAnnotationError{"标签只能是字符串"}
				return Error(500, "保存Grahpite注释失败", err)
			}
		}
	default:
		err := &CreateAnnotationError{"不支持的标签格式"}
		return Error(500, "保存Grahpite注释失败", err)
	}

	item := annotations.Item{
		OrgId:  c.OrgId,
		UserId: c.UserId,
		Epoch:  cmd.When * 1000,
		Text:   text,
		Tags:   tagsArray,
	}

	if err := repo.Save(&item); err != nil {
		return Error(500, "保存Grahpite注释失败", err)
	}

	return JSON(200, util.DynMap{
		"message": "Graphite注释添加成功",
		"id":      item.Id,
	})
}

func UpdateAnnotation(c *m.ReqContext, cmd dtos.UpdateAnnotationsCmd) Response {
	annotationID := c.ParamsInt64(":annotationId")

	repo := annotations.GetRepository()

	if resp := canSave(c, repo, annotationID); resp != nil {
		return resp
	}

	item := annotations.Item{
		OrgId:  c.OrgId,
		UserId: c.UserId,
		Id:     annotationID,
		Epoch:  cmd.Time,
		Text:   cmd.Text,
		Tags:   cmd.Tags,
	}

	if err := repo.Update(&item); err != nil {
		return Error(500, "保存注释失败", err)
	}

	if cmd.IsRegion {
		itemRight := item
		itemRight.RegionId = item.Id
		itemRight.Epoch = cmd.TimeEnd

		// We don't know id of region right event, so set it to 0 and find then using query like
		// ... WHERE region_id = <item.RegionId> AND id != <item.RegionId> ...
		itemRight.Id = 0

		if err := repo.Update(&itemRight); err != nil {
			return Error(500, "保存注释的区域或者时间失败", err)
		}
	}

	return Success("注释保存成功")
}

func DeleteAnnotations(c *m.ReqContext, cmd dtos.DeleteAnnotationsCmd) Response {
	repo := annotations.GetRepository()

	err := repo.Delete(&annotations.DeleteParams{
		OrgId:       c.OrgId,
		Id:          cmd.AnnotationId,
		RegionId:    cmd.RegionId,
		DashboardId: cmd.DashboardId,
		PanelId:     cmd.PanelId,
	})

	if err != nil {
		return Error(500, "注释删除失败", err)
	}

	return Success("注释删除成功")
}

func DeleteAnnotationByID(c *m.ReqContext) Response {
	repo := annotations.GetRepository()
	annotationID := c.ParamsInt64(":annotationId")

	if resp := canSave(c, repo, annotationID); resp != nil {
		return resp
	}

	err := repo.Delete(&annotations.DeleteParams{
		OrgId: c.OrgId,
		Id:    annotationID,
	})

	if err != nil {
		return Error(500, "注释删除失败", err)
	}

	return Success("注释删除成功")
}

func DeleteAnnotationRegion(c *m.ReqContext) Response {
	repo := annotations.GetRepository()
	regionID := c.ParamsInt64(":regionId")

	if resp := canSave(c, repo, regionID); resp != nil {
		return resp
	}

	err := repo.Delete(&annotations.DeleteParams{
		OrgId:    c.OrgId,
		RegionId: regionID,
	})

	if err != nil {
		return Error(500, "注释区域删除失败", err)
	}

	return Success("注释区域删除成功")
}

func canSaveByDashboardID(c *m.ReqContext, dashboardID int64) (bool, error) {
	if dashboardID == 0 && !c.SignedInUser.HasRole(m.ROLE_EDITOR) {
		return false, nil
	}

	if dashboardID != 0 {
		guard := guardian.New(dashboardID, c.OrgId, c.SignedInUser)
		if canEdit, err := guard.CanEdit(); err != nil || !canEdit {
			return false, err
		}
	}

	return true, nil
}

func canSave(c *m.ReqContext, repo annotations.Repository, annotationID int64) Response {
	items, err := repo.Find(&annotations.ItemQuery{AnnotationId: annotationID, OrgId: c.OrgId})

	if err != nil || len(items) == 0 {
		return Error(500, "没有找到要保存的注释", err)
	}

	dashboardID := items[0].DashboardId

	if canSave, err := canSaveByDashboardID(c, dashboardID); err != nil || !canSave {
		return dashboardGuardianResponse(err)
	}

	return nil
}
