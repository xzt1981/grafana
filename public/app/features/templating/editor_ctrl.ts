import _ from 'lodash';
import coreModule from 'app/core/core_module';
import { variableTypes } from './variable';
import appEvents from 'app/core/app_events';

export class VariableEditorCtrl {
  /** @ngInject **/
  constructor($scope, datasourceSrv, variableSrv, templateSrv) {
    $scope.variableTypes = variableTypes;
    $scope.ctrl = {};
    $scope.namePattern = /^(?!__).*$/;
    $scope._ = _;
    $scope.optionsLimit = 20;

    $scope.refreshOptions = [
      { value: 0, text: '从不' },
      { value: 1, text: '加载仪表盘时' },
      { value: 2, text: '时间窗改变时' },
    ];

    $scope.sortOptions = [
      { value: 0, text: '禁用' },
      { value: 1, text: '字母 (升序)' },
      { value: 2, text: '字母 (降序)' },
      { value: 3, text: '数字 (升序)' },
      { value: 4, text: '数字 (降序)' },
      { value: 5, text: '字母 (大小写不敏感, 升序)' },
      { value: 6, text: '字母 (大小写不敏感, 降序)' },
    ];

    $scope.hideOptions = [{ value: 0, text: '' }, { value: 1, text: '标签' }, { value: 2, text: '变量' }];

    $scope.init = function() {
      $scope.mode = 'list';

      $scope.variables = variableSrv.variables;
      $scope.reset();

      $scope.$watch('mode', function(val) {
        if (val === 'new') {
          $scope.reset();
        }
      });
    };

    $scope.setMode = function(mode) {
      $scope.mode = mode;
    };

    $scope.add = function() {
      if ($scope.isValid()) {
        variableSrv.addVariable($scope.current);
        $scope.update();
      }
    };

    $scope.isValid = function() {
      if (!$scope.ctrl.form.$valid) {
        return false;
      }

      if (!$scope.current.name.match(/^\w+$/)) {
        appEvents.emit('alert-warning', ['验证', '变量名中只允许出现字母和数字。']);
        return false;
      }

      var sameName = _.find($scope.variables, { name: $scope.current.name });
      if (sameName && sameName !== $scope.current) {
        appEvents.emit('alert-warning', ['验证', '该变量名已经存在。']);
        return false;
      }

      if (
        $scope.current.type === 'query' &&
        $scope.current.query.match(new RegExp('\\$' + $scope.current.name + '(/| |$)'))
      ) {
        appEvents.emit('alert-warning', ['验证', '查询不能包含到自身的引用， 变量: $' + $scope.current.name]);
        return false;
      }

      return true;
    };

    $scope.validate = function() {
      $scope.infoText = '';
      if ($scope.current.type === 'adhoc' && $scope.current.datasource !== null) {
        $scope.infoText = '临时过滤器被自动应用于所有到该数据源的查询。';
        datasourceSrv.get($scope.current.datasource).then(ds => {
          if (!ds.getTagKeys) {
            $scope.infoText = '该数据源尚不支持临时过滤器.';
          }
        });
      }
    };

    $scope.runQuery = function() {
      $scope.optionsLimit = 20;
      return variableSrv.updateOptions($scope.current).catch(err => {
        if (err.data && err.data.message) {
          err.message = err.data.message;
        }
        appEvents.emit('alert-error', ['模板', '模板变量不能被初始化: ' + err.message]);
      });
    };

    $scope.edit = function(variable) {
      $scope.current = variable;
      $scope.currentIsNew = false;
      $scope.mode = 'edit';
      $scope.validate();
    };

    $scope.duplicate = function(variable) {
      var clone = _.cloneDeep(variable.getSaveModel());
      $scope.current = variableSrv.createVariableFromModel(clone);
      $scope.current.name = 'copy_of_' + variable.name;
      variableSrv.addVariable($scope.current);
    };

    $scope.update = function() {
      if ($scope.isValid()) {
        $scope.runQuery().then(function() {
          $scope.reset();
          $scope.mode = 'list';
          templateSrv.updateTemplateData();
        });
      }
    };

    $scope.reset = function() {
      $scope.currentIsNew = true;
      $scope.current = variableSrv.createVariableFromModel({ type: 'query' });

      // this is done here in case a new data source type variable was added
      $scope.datasources = _.filter(datasourceSrv.getMetricSources(), function(ds) {
        return !ds.meta.mixed && ds.value !== null;
      });

      $scope.datasourceTypes = _($scope.datasources)
        .uniqBy('meta.id')
        .map(function(ds) {
          return { text: ds.meta.name, value: ds.meta.id };
        })
        .value();
    };

    $scope.typeChanged = function() {
      var old = $scope.current;
      $scope.current = variableSrv.createVariableFromModel({
        type: $scope.current.type,
      });
      $scope.current.name = old.name;
      $scope.current.hide = old.hide;
      $scope.current.label = old.label;

      var oldIndex = _.indexOf(this.variables, old);
      if (oldIndex !== -1) {
        this.variables[oldIndex] = $scope.current;
      }

      $scope.validate();
    };

    $scope.removeVariable = function(variable) {
      variableSrv.removeVariable(variable);
    };

    $scope.showMoreOptions = function() {
      $scope.optionsLimit += 20;
    };
  }
}

coreModule.controller('VariableEditorCtrl', VariableEditorCtrl);
