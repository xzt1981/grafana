import kbn from 'app/core/utils/kbn';

export class AxesEditorCtrl {
  panel: any;
  panelCtrl: any;
  unitFormats: any;
  logScales: any;
  xAxisModes: any;
  xAxisStatOptions: any;
  xNameSegment: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.$scope.ctrl = this;

    this.unitFormats = kbn.getUnitFormats();

    this.logScales = {
      linear: 1,
      'log (base 2)': 2,
      'log (base 10)': 10,
      'log (base 32)': 32,
      'log (base 1024)': 1024,
    };

    this.xAxisModes = {
      Time: '时间',
      Series: '序列',
      Histogram: '直方图',
      // 'Data field': 'field',
    };

    this.xAxisStatOptions = [
      { text: '平均', value: 'avg' },
      { text: '最小', value: 'min' },
      { text: '最大', value: 'max' },
      { text: '总数', value: 'total' },
      { text: '计数', value: 'count' },
      { text: '当前', value: 'current' },
    ];

    if (this.panel.xaxis.mode === 'custom') {
      if (!this.panel.xaxis.name) {
        this.panel.xaxis.name = 'specify field';
      }
    }
  }

  setUnitFormat(axis, subItem) {
    axis.format = subItem.value;
    this.panelCtrl.render();
  }

  render() {
    this.panelCtrl.render();
  }

  xAxisModeChanged() {
    this.panelCtrl.processor.setPanelDefaultsForNewXAxisMode();
    this.panelCtrl.onDataReceived(this.panelCtrl.dataList);
  }

  xAxisValueChanged() {
    this.panelCtrl.onDataReceived(this.panelCtrl.dataList);
  }

  getDataFieldNames(onlyNumbers) {
    var props = this.panelCtrl.processor.getDataFieldNames(this.panelCtrl.dataList, onlyNumbers);
    var items = props.map(prop => {
      return { text: prop, value: prop };
    });

    return this.$q.when(items);
  }
}

/** @ngInject **/
export function axesEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/graph/axes_editor.html',
    controller: AxesEditorCtrl,
  };
}
