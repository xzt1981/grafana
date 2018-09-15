import _ from 'lodash';
import angular from 'angular';

/** @ngInject */
export function SeriesOverridesCtrl($scope, $element, popoverSrv) {
  $scope.overrideMenu = [];
  $scope.currentOverrides = [];
  $scope.override = $scope.override || {};

  $scope.addOverrideOption = function(name, propertyName, values) {
    var option = {
      text: name,
      propertyName: propertyName,
      index: $scope.overrideMenu.lenght,
      values: values,
      submenu: _.map(values, function(value) {
        return { text: String(value), value: value };
      }),
    };

    $scope.overrideMenu.push(option);
  };

  $scope.setOverride = function(item, subItem) {
    // handle color overrides
    if (item.propertyName === 'color') {
      $scope.openColorSelector($scope.override['color']);
      return;
    }

    $scope.override[item.propertyName] = subItem.value;

    // automatically disable lines for this series and the fill below to series
    // can be removed by the user if they still want lines
    if (item.propertyName === 'fillBelowTo') {
      $scope.override['lines'] = false;
      $scope.ctrl.addSeriesOverride({ alias: subItem.value, lines: false });
    }

    $scope.updateCurrentOverrides();
    $scope.ctrl.render();
  };

  $scope.colorSelected = function(color) {
    $scope.override['color'] = color;
    $scope.updateCurrentOverrides();
    $scope.ctrl.render();
  };

  $scope.openColorSelector = function(color) {
    var fakeSeries = { color: color };
    popoverSrv.show({
      element: $element.find('.dropdown')[0],
      position: 'top center',
      openOn: 'click',
      template: '<series-color-picker series="series" onColorChange="colorSelected" />',
      model: {
        autoClose: true,
        colorSelected: $scope.colorSelected,
        series: fakeSeries,
      },
      onClose: function() {
        $scope.ctrl.render();
      },
    });
  };

  $scope.removeOverride = function(option) {
    delete $scope.override[option.propertyName];
    $scope.updateCurrentOverrides();
    $scope.ctrl.refresh();
  };

  $scope.getSeriesNames = function() {
    return _.map($scope.ctrl.seriesList, function(series) {
      return series.alias;
    });
  };

  $scope.updateCurrentOverrides = function() {
    $scope.currentOverrides = [];
    _.each($scope.overrideMenu, function(option) {
      var value = $scope.override[option.propertyName];
      if (_.isUndefined(value)) {
        return;
      }
      $scope.currentOverrides.push({
        name: option.text,
        propertyName: option.propertyName,
        value: String(value),
      });
    });
  };

  $scope.addOverrideOption('条块', 'bars', [true, false]);
  $scope.addOverrideOption('线条', 'lines', [true, false]);
  $scope.addOverrideOption('线型填充', 'fill', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  $scope.addOverrideOption('线宽', 'linewidth', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  $scope.addOverrideOption('无点模式', 'nullPointMode', ['相接', '空', '0值']);
  $scope.addOverrideOption('往下填充', 'fillBelowTo', $scope.getSeriesNames());
  $scope.addOverrideOption('阶梯线条', 'steppedLine', [true, false]);
  $scope.addOverrideOption('短划线', 'dashes', [true, false]);
  $scope.addOverrideOption('短划长度', 'dashLength', [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
  ]);
  $scope.addOverrideOption('短划间隔', 'spaceLength', [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
  ]);
  $scope.addOverrideOption('圆点', 'points', [true, false]);
  $scope.addOverrideOption('圆点半径', 'pointradius', [1, 2, 3, 4, 5]);
  $scope.addOverrideOption('栈', 'stack', [true, false, 'A', 'B', 'C', 'D']);
  $scope.addOverrideOption('颜色', 'color', ['change']);
  $scope.addOverrideOption('Y-轴', 'yaxis', [1, 2]);
  $scope.addOverrideOption('Z-指数', 'zindex', [-3, -2, -1, 0, 1, 2, 3]);
  $scope.addOverrideOption('转换', 'transform', ['negative-Y']);
  $scope.addOverrideOption('图例', 'legend', [true, false]);
  $scope.addOverrideOption('隐藏提示', 'hideTooltip', [true, false]);
  $scope.updateCurrentOverrides();
}

angular.module('grafana.controllers').controller('SeriesOverridesCtrl', SeriesOverridesCtrl);
