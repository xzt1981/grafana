import _ from 'lodash';

export class ElasticConfigCtrl {
  static templateUrl = 'public/app/plugins/datasource/elasticsearch/partials/config.html';
  current: any;

  /** @ngInject */
  constructor($scope) {
    this.current.jsonData.timeField = this.current.jsonData.timeField || '@timestamp';
    this.current.jsonData.esVersion = this.current.jsonData.esVersion || 5;
    this.current.jsonData.maxConcurrentShardRequests = this.current.jsonData.maxConcurrentShardRequests || 256;
  }

  indexPatternTypes = [
    { name: '无模式', value: undefined },
    { name: '时', value: 'Hourly', example: '[logstash-]YYYY.MM.DD.HH' },
    { name: '天', value: 'Daily', example: '[logstash-]YYYY.MM.DD' },
    { name: '周', value: 'Weekly', example: '[logstash-]GGGG.WW' },
    { name: '月', value: 'Monthly', example: '[logstash-]YYYY.MM' },
    { name: '年', value: 'Yearly', example: '[logstash-]YYYY' },
  ];

  esVersions = [{ name: '2.x', value: 2 }, { name: '5.x', value: 5 }, { name: '5.6+', value: 56 }];

  indexPatternTypeChanged() {
    var def = _.find(this.indexPatternTypes, {
      value: this.current.jsonData.interval,
    });
    this.current.database = def.example || 'es-index-name';
  }
}
