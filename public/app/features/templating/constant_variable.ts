import { Variable, assignModelProperties, variableTypes } from './variable';

export class ConstantVariable implements Variable {
  query: string;
  options: any[];
  current: any;
  skipUrlSync: boolean;

  defaults = {
    type: 'constant',
    name: '',
    hide: 2,
    label: '',
    query: '',
    current: {},
    options: [],
    skipUrlSync: false,
  };

  /** @ngInject **/
  constructor(private model, private variableSrv) {
    assignModelProperties(this, model, this.defaults);
  }

  getSaveModel() {
    assignModelProperties(this.model, this, this.defaults);
    return this.model;
  }

  setValue(option) {
    this.variableSrv.setOptionAsCurrent(this, option);
  }

  updateOptions() {
    this.options = [{ text: this.query.trim(), value: this.query.trim() }];
    this.setValue(this.options[0]);
    return Promise.resolve();
  }

  dependsOn(variable) {
    return false;
  }

  setValueFromUrl(urlValue) {
    return this.variableSrv.setOptionFromUrl(this, urlValue);
  }

  getValueForUrl() {
    return this.current.value;
  }
}

variableTypes['constant'] = {
  name: '常量',
  ctor: ConstantVariable,
  description: '定义一个隐藏的常量, 有助于你想要分享的仪表盘度量前缀',
};
