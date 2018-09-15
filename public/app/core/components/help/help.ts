import coreModule from '../../core_module';
import appEvents from 'app/core/app_events';

export class HelpCtrl {
  tabIndex: any;
  shortcuts: any;

  /** @ngInject */
  constructor() {
    this.tabIndex = 0;
    this.shortcuts = {
      Global: [
        { keys: ['g', 'h'], description: '转至我的仪表盘' },
        { keys: ['g', 'p'], description: '转至我的设置' },
        { keys: ['s', 'o'], description: '打开搜索' },
        { keys: ['s', 's'], description: '打开搜索标记过滤器' },
        { keys: ['s', 't'], description: '打开搜索标签视图' },
        { keys: ['esc'], description: '退出编辑/设置视图' },
      ],
      Dashboard: [
        { keys: ['mod+s'], description: '保存仪表盘' },
        { keys: ['d', 'r'], description: '刷新所有面板' },
        { keys: ['d', 's'], description: '仪表盘设置' },
        { keys: ['d', 'v'], description: '开启视图模式' },
        { keys: ['d', 'k'], description: '开启全屏模式 (隐藏顶部导航栏)' },
        { keys: ['d', 'E'], description: '展开所有行' },
        { keys: ['d', 'C'], description: '折叠所有行' },
        { keys: ['mod+o'], description: '开启共享准星模式' },
      ],
      'Focused Panel': [
        { keys: ['e'], description: '开启面板编辑模式' },
        { keys: ['v'], description: '开启面板全屏模式' },
        { keys: ['p', 's'], description: '打开面板共享模式' },
        { keys: ['p', 'd'], description: '克隆面板' },
        { keys: ['p', 'r'], description: '删除面板' },
      ],
      'Time Range': [
        { keys: ['t', 'z'], description: '缩小时间段' },
        {
          keys: ['t', '<i class="fa fa-long-arrow-left"></i>'],
          description: '向后移动时间窗',
        },
        {
          keys: ['t', '<i class="fa fa-long-arrow-right"></i>'],
          description: '向前移动时间窗',
        },
      ],
    };
  }

  dismiss() {
    appEvents.emit('hide-modal');
  }
}

export function helpModal() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/core/components/help/help.html',
    controller: HelpCtrl,
    bindToController: true,
    transclude: true,
    controllerAs: 'ctrl',
    scope: {},
  };
}

coreModule.directive('helpModal', helpModal);
