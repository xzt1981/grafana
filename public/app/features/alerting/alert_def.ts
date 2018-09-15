import _ from 'lodash';
import { QueryPartDef, QueryPart } from 'app/core/components/query_part/query_part';

var alertQueryDef = new QueryPartDef({
  type: 'query',
  params: [
    { name: 'queryRefId', type: 'string', dynamicLookup: true },
    {
      name: 'from',
      type: 'string',
      options: ['1s', '10s', '1m', '5m', '10m', '15m', '1h', '24h', '48h'],
    },
    { name: 'to', type: 'string', options: ['now'] },
  ],
  defaultParams: ['#A', '15m', 'now', 'avg'],
});

var conditionTypes = [{ text: '查询', value: 'query' }];

var alertStateSortScore = {
  alerting: 1,
  no_data: 2,
  pending: 3,
  ok: 4,
  paused: 5,
};

var evalFunctions = [
  { text: '大于', value: 'gt' },
  { text: '小于', value: 'lt' },
  { text: '范围之外', value: 'outside_range' },
  { text: '范围之内', value: 'within_range' },
  { text: '空值', value: 'no_value' },
];

var evalOperators = [{ text: '或', value: 'or' }, { text: '与', value: 'and' }];

var reducerTypes = [
  { text: 'avg()', value: 'avg' },
  { text: 'min()', value: 'min' },
  { text: 'max()', value: 'max' },
  { text: 'sum()', value: 'sum' },
  { text: 'count()', value: 'count' },
  { text: 'last()', value: 'last' },
  { text: 'median()', value: 'median' },
  { text: 'diff()', value: 'diff' },
  { text: 'percent_diff()', value: 'percent_diff' },
  { text: 'count_non_null()', value: 'count_non_null' },
];

var noDataModes = [
  { text: '报警', value: 'alerting' },
  { text: '没有数据', value: 'no_data' },
  { text: '保持最近状态', value: 'keep_state' },
  { text: '好', value: 'ok' },
];

var executionErrorModes = [{ text: '报警', value: 'alerting' }, { text: '保持最近状态', value: 'keep_state' }];

function createReducerPart(model) {
  var def = new QueryPartDef({ type: model.type, defaultParams: [] });
  return new QueryPart(model, def);
}

function getStateDisplayModel(state) {
  switch (state) {
    case 'ok': {
      return {
        text: '好',
        iconClass: 'icon-gf icon-gf-online',
        stateClass: 'alert-state-ok',
      };
    }
    case 'alerting': {
      return {
        text: '报警',
        iconClass: 'icon-gf icon-gf-critical',
        stateClass: 'alert-state-critical',
      };
    }
    case 'no_data': {
      return {
        text: '没有数值',
        iconClass: 'fa fa-question',
        stateClass: 'alert-state-warning',
      };
    }
    case 'paused': {
      return {
        text: '暂停',
        iconClass: 'fa fa-pause',
        stateClass: 'alert-state-paused',
      };
    }
    case 'pending': {
      return {
        text: '挂起',
        iconClass: 'fa fa-exclamation',
        stateClass: 'alert-state-warning',
      };
    }
  }

  throw { message: '未知报警' };
}

function joinEvalMatches(matches, separator: string) {
  return _.reduce(
    matches,
    (res, ev) => {
      if (ev.metric !== undefined && ev.value !== undefined) {
        res.push(ev.metric + '=' + ev.value);
      }

      // For backwards compatibility . Should be be able to remove this after ~2017-06-01
      if (ev.Metric !== undefined && ev.Value !== undefined) {
        res.push(ev.Metric + '=' + ev.Value);
      }

      return res;
    },
    []
  ).join(separator);
}

function getAlertAnnotationInfo(ah) {
  // backward compatibility, can be removed in grafana 5.x
  // old way stored evalMatches in data property directly,
  // new way stores it in evalMatches property on new data object

  if (_.isArray(ah.data)) {
    return joinEvalMatches(ah.data, ', ');
  } else if (_.isArray(ah.data.evalMatches)) {
    return joinEvalMatches(ah.data.evalMatches, ', ');
  }

  if (ah.data.error) {
    return 'Error: ' + ah.data.error;
  }

  return '';
}

export default {
  alertQueryDef: alertQueryDef,
  getStateDisplayModel: getStateDisplayModel,
  conditionTypes: conditionTypes,
  evalFunctions: evalFunctions,
  evalOperators: evalOperators,
  noDataModes: noDataModes,
  executionErrorModes: executionErrorModes,
  reducerTypes: reducerTypes,
  createReducerPart: createReducerPart,
  getAlertAnnotationInfo: getAlertAnnotationInfo,
  alertStateSortScore: alertStateSortScore,
};
