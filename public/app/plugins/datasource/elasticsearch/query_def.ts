import _ from 'lodash';

export const metricAggTypes = [
  { text: '计数', value: 'count', requiresField: false },
  {
    text: '平均值',
    value: 'avg',
    requiresField: true,
    supportsInlineScript: true,
    supportsMissing: true,
  },
  {
    text: '总和',
    value: 'sum',
    requiresField: true,
    supportsInlineScript: true,
    supportsMissing: true,
  },
  {
    text: '最大',
    value: 'max',
    requiresField: true,
    supportsInlineScript: true,
    supportsMissing: true,
  },
  {
    text: '最小',
    value: 'min',
    requiresField: true,
    supportsInlineScript: true,
    supportsMissing: true,
  },
  {
    text: '扩展统计',
    value: 'extended_stats',
    requiresField: true,
    supportsMissing: true,
    supportsInlineScript: true,
  },
  {
    text: '百分数',
    value: 'percentiles',
    requiresField: true,
    supportsMissing: true,
    supportsInlineScript: true,
  },
  {
    text: '不重复计数',
    value: 'cardinality',
    requiresField: true,
    supportsMissing: true,
  },
  {
    text: '滑动平均',
    value: 'moving_avg',
    requiresField: false,
    isPipelineAgg: true,
    minVersion: 2,
  },
  {
    text: '方差',
    value: 'derivative',
    requiresField: false,
    isPipelineAgg: true,
    minVersion: 2,
  },
  { text: '原始文档', value: 'raw_document', requiresField: false },
];

export const bucketAggTypes = [
  { text: '术语', value: 'terms', requiresField: true },
  { text: '过滤器', value: 'filters' },
  { text: '地理哈希网格', value: 'geohash_grid', requiresField: true },
  { text: '日期直方图Date Histogram', value: 'date_histogram', requiresField: true },
  { text: '直方图', value: 'histogram', requiresField: true },
];

export const orderByOptions = [{ text: 'Doc Count', value: '_count' }, { text: 'Term value', value: '_term' }];

export const orderOptions = [{ text: 'Top', value: 'desc' }, { text: 'Bottom', value: 'asc' }];

export const sizeOptions = [
  { text: '没有限制', value: '0' },
  { text: '1', value: '1' },
  { text: '2', value: '2' },
  { text: '3', value: '3' },
  { text: '5', value: '5' },
  { text: '10', value: '10' },
  { text: '15', value: '15' },
  { text: '20', value: '20' },
];

export const extendedStats = [
  { text: '平均', value: 'avg' },
  { text: '最小', value: 'min' },
  { text: '最大', value: 'max' },
  { text: '总和', value: 'sum' },
  { text: '计数', value: 'count' },
  { text: '标准方差', value: 'std_deviation' },
  { text: '标准方差上限', value: 'std_deviation_bounds_upper' },
  { text: '标准方差下限', value: 'std_deviation_bounds_lower' },
];

export const intervalOptions = [
  { text: '自动', value: 'auto' },
  { text: '10s', value: '10s' },
  { text: '1m', value: '1m' },
  { text: '5m', value: '5m' },
  { text: '10m', value: '10m' },
  { text: '20m', value: '20m' },
  { text: '1h', value: '1h' },
  { text: '1d', value: '1d' },
];

export const movingAvgModelOptions = [
  { text: '简单', value: 'simple' },
  { text: '线性', value: 'linear' },
  { text: '指数加权', value: 'ewma' },
  { text: '霍尔特线性', value: 'holt' },
  { text: 'Holt Winters', value: 'holt_winters' },
];

export const pipelineOptions = {
  moving_avg: [
    { text: '窗口', default: 5 },
    { text: '模型', default: 'simple' },
    { text: '预测', default: undefined },
    { text: '最小', default: false },
  ],
  derivative: [{ text: 'unit', default: undefined }],
};

export const movingAvgModelSettings = {
  simple: [],
  linear: [],
  ewma: [{ text: '阿尔法', value: 'alpha', default: undefined }],
  holt: [{ text: '阿尔法', value: 'alpha', default: undefined }, { text: '贝塔', value: 'beta', default: undefined }],
  holt_winters: [
    { text: '阿尔法', value: 'alpha', default: undefined },
    { text: '贝塔', value: 'beta', default: undefined },
    { text: '伽马', value: 'gamma', default: undefined },
    { text: '周期', value: 'period', default: undefined },
    { text: 'Pad', value: 'pad', default: undefined, isCheckbox: true },
  ],
};

export function getMetricAggTypes(esVersion) {
  return _.filter(metricAggTypes, function(f) {
    if (f.minVersion) {
      return f.minVersion <= esVersion;
    } else {
      return true;
    }
  });
}

export function getPipelineOptions(metric) {
  if (!isPipelineAgg(metric.type)) {
    return [];
  }

  return pipelineOptions[metric.type];
}

export function isPipelineAgg(metricType) {
  if (metricType) {
    var po = pipelineOptions[metricType];
    return po !== null && po !== undefined;
  }

  return false;
}

export function getPipelineAggOptions(targets) {
  var result = [];
  _.each(targets.metrics, function(metric) {
    if (!isPipelineAgg(metric.type)) {
      result.push({ text: describeMetric(metric), value: metric.id });
    }
  });

  return result;
}

export function getMovingAvgSettings(model, filtered) {
  var filteredResult = [];
  if (filtered) {
    _.each(movingAvgModelSettings[model], function(setting) {
      if (!setting.isCheckbox) {
        filteredResult.push(setting);
      }
    });
    return filteredResult;
  }
  return movingAvgModelSettings[model];
}

export function getOrderByOptions(target) {
  var metricRefs = [];
  _.each(target.metrics, function(metric) {
    if (metric.type !== 'count') {
      metricRefs.push({ text: describeMetric(metric), value: metric.id });
    }
  });

  return orderByOptions.concat(metricRefs);
}

export function describeOrder(order) {
  var def = _.find(orderOptions, { value: order });
  return def.text;
}

export function describeMetric(metric) {
  var def = _.find(metricAggTypes, { value: metric.type });
  return def.text + ' ' + metric.field;
}

export function describeOrderBy(orderBy, target) {
  var def = _.find(orderByOptions, { value: orderBy });
  if (def) {
    return def.text;
  }
  var metric = _.find(target.metrics, { id: orderBy });
  if (metric) {
    return describeMetric(metric);
  } else {
    return 'metric not found';
  }
}
