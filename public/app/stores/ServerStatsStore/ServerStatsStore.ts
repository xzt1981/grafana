import { types, getEnv, flow } from 'mobx-state-tree';
import { ServerStat } from './ServerStat';

export const ServerStatsStore = types
  .model('ServerStatsStore', {
    stats: types.array(ServerStat),
    error: types.optional(types.string, ''),
  })
  .actions(self => ({
    load: flow(function* load() {
      const backendSrv = getEnv(self).backendSrv;
      const res = yield backendSrv.get('/api/admin/stats');
      self.stats.clear();
      self.stats.push(ServerStat.create({ name: '所有仪表盘', value: res.dashboards }));
      self.stats.push(ServerStat.create({ name: '所有用户', value: res.users }));
      self.stats.push(ServerStat.create({ name: '活跃用户 (最近30天登录过)', value: res.activeUsers }));
      self.stats.push(ServerStat.create({ name: '所有机构', value: res.orgs }));
      self.stats.push(ServerStat.create({ name: '所有展示列表', value: res.playlists }));
      self.stats.push(ServerStat.create({ name: '所有快照', value: res.snapshots }));
      self.stats.push(ServerStat.create({ name: '所有仪表盘标签', value: res.tags }));
      self.stats.push(ServerStat.create({ name: '所有收藏的仪表盘', value: res.stars }));
      self.stats.push(ServerStat.create({ name: '所有报警', value: res.alerts }));
    }),
  }));
