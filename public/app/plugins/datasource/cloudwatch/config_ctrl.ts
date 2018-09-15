export class CloudWatchConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;

  accessKeyExist = false;
  secretKeyExist = false;

  /** @ngInject */
  constructor($scope) {
    this.current.jsonData.timeField = this.current.jsonData.timeField || '@timestamp';
    this.current.jsonData.authType = this.current.jsonData.authType || 'credentials';

    this.accessKeyExist = this.current.secureJsonFields.accessKey;
    this.secretKeyExist = this.current.secureJsonFields.secretKey;
  }

  resetAccessKey() {
    this.accessKeyExist = false;
  }

  resetSecretKey() {
    this.secretKeyExist = false;
  }

  authTypes = [
    { name: '访问密钥', value: 'keys' },
    { name: '密钥文件', value: 'credentials' },
    { name: 'ARN', value: 'arn' },
  ];

  indexPatternTypes = [
    { name: '无模式', value: undefined },
    { name: '时', value: 'Hourly', example: '[logstash-]YYYY.MM.DD.HH' },
    { name: '天', value: 'Daily', example: '[logstash-]YYYY.MM.DD' },
    { name: '周', value: 'Weekly', example: '[logstash-]GGGG.WW' },
    { name: '月', value: 'Monthly', example: '[logstash-]YYYY.MM' },
    { name: '年', value: 'Yearly', example: '[logstash-]YYYY' },
  ];
}
