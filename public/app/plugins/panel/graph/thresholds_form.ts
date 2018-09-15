import coreModule from 'app/core/core_module';

export class ThresholdFormCtrl {
  panelCtrl: any;
  panel: any;
  disabled: boolean;

  /** @ngInject */
  constructor($scope) {
    this.panel = this.panelCtrl.panel;

    if (this.panel.alert) {
      this.disabled = true;
    }

    var unbindDestroy = $scope.$on('$destroy', () => {
      this.panelCtrl.editingThresholds = false;
      this.panelCtrl.render();
      unbindDestroy();
    });

    this.panelCtrl.editingThresholds = true;
  }

  addThreshold() {
    this.panel.thresholds.push({
      value: undefined,
      colorMode: 'critical',
      op: 'gt',
      fill: true,
      line: true,
      yaxis: 'left',
    });
    this.panelCtrl.render();
  }

  removeThreshold(index) {
    this.panel.thresholds.splice(index, 1);
    this.panelCtrl.render();
  }

  render() {
    this.panelCtrl.render();
  }

  onFillColorChange(index) {
    return newColor => {
      this.panel.thresholds[index].fillColor = newColor;
      this.render();
    };
  }

  onLineColorChange(index) {
    return newColor => {
      this.panel.thresholds[index].lineColor = newColor;
      this.render();
    };
  }
}

var template = `
<div class="gf-form-group">
  <h5>阈值定义</h5>
  <p class="muted" ng-show="ctrl.disabled">
    可视化阈值选项已被<strong>禁用。</strong>
    切换到报警页以更新阈值
    如果要重新启用报警阈值，报警规则必须从本面板中删除。
  </p>
  <div ng-class="{'thresholds-form-disabled': ctrl.disabled}">
    <div class="gf-form-inline" ng-repeat="threshold in ctrl.panel.thresholds">
      <div class="gf-form">
        <label class="gf-form-label">T{{$index+1}}</label>
      </div>

      <div class="gf-form">
        <div class="gf-form-select-wrapper">
          <select class="gf-form-input" ng-model="threshold.op"
                  ng-options="f for f in ['大于', '小于']" ng-change="ctrl.render()" ng-disabled="ctrl.disabled"></select>
        </div>
        <input type="number" ng-model="threshold.value" class="gf-form-input width-8"
               ng-change="ctrl.render()" placeholder="数值" ng-disabled="ctrl.disabled">
      </div>

      <div class="gf-form">
        <label class="gf-form-label">颜色</label>
        <div class="gf-form-select-wrapper">
          <select class="gf-form-input" ng-model="threshold.colorMode"
                  ng-options="f for f in ['自定义', '严重', '警告', '良好']" ng-change="ctrl.render()" ng-disabled="ctrl.disabled">
          </select>
        </div>
      </div>

      <gf-form-switch class="gf-form" label="填充" checked="threshold.fill"
                      on-change="ctrl.render()" ng-disabled="ctrl.disabled"></gf-form-switch>

      <div class="gf-form" ng-if="threshold.fill && threshold.colorMode === '自定义'">
        <label class="gf-form-label">填充颜色</label>
        <span class="gf-form-label">
          <color-picker color="threshold.fillColor" onChange="ctrl.onFillColorChange($index)"></color-picker>
        </span>
      </div>

      <gf-form-switch class="gf-form" label="线条" checked="threshold.line"
                      on-change="ctrl.render()" ng-disabled="ctrl.disabled"></gf-form-switch>

      <div class="gf-form" ng-if="threshold.line && threshold.colorMode === '自定义'">
        <label class="gf-form-label">线条颜色</label>
        <span class="gf-form-label">
          <color-picker color="threshold.lineColor" onChange="ctrl.onLineColorChange($index)"></color-picker>
        </span>
      </div>

      <div class="gf-form">
        <label class="gf-form-label">Y-轴</label>
        <div class="gf-form-select-wrapper">
          <select class="gf-form-input" ng-model="threshold.yaxis"
                  ng-init="threshold.yaxis = threshold.yaxis === '左' || threshold.yaxis === '右' ? threshold.yaxis : '左'"
                  ng-options="f for f in ['左', '右']" ng-change="ctrl.render()" ng-disabled="ctrl.disabled">
          </select>
        </div>
      </div>

      <div class="gf-form">
        <label class="gf-form-label">
          <a class="pointer" ng-click="ctrl.removeThreshold($index)" ng-disabled="ctrl.disabled">
            <i class="fa fa-trash"></i>
          </a>
        </label>
      </div>
    </div>

    <div class="gf-form-button-row">
      <button class="btn btn-inverse" ng-click="ctrl.addThreshold()" ng-disabled="ctrl.disabled">
        <i class="fa fa-plus"></i>&nbsp;添加阈值
      </button>
    </div>
  </div>
</div>
`;

coreModule.directive('graphThresholdForm', function() {
  return {
    restrict: 'E',
    template: template,
    controller: ThresholdFormCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      panelCtrl: '=',
    },
  };
});
