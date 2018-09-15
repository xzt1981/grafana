import _ from 'lodash';
import { types, getEnv } from 'mobx-state-tree';
import { NavItem } from './NavItem';
import { ITeam } from '../TeamsStore/TeamsStore';

export const NavStore = types
  .model('NavStore', {
    main: types.maybe(NavItem),
    node: types.maybe(NavItem),
  })
  .actions(self => ({
    load(...args) {
      let children = getEnv(self).navTree;
      let main, node;
      let parents = [];

      for (let id of args) {
        node = children.find(el => el.id === id);

        if (!node) {
          throw new Error(`NavItem with id ${id} not found`);
        }

        children = node.children;
        parents.push(node);
      }

      main = parents[parents.length - 2];

      if (main.children) {
        for (let item of main.children) {
          item.active = false;

          if (item.url === node.url) {
            item.active = true;
          }
        }
      }

      self.main = NavItem.create(main);
      self.node = NavItem.create(node);
    },

    initFolderNav(folder: any, activeChildId: string) {
      let main = {
        icon: 'fa fa-folder-open',
        id: 'manage-folder',
        subTitle: '仪表盘和权限管理',
        url: '',
        text: folder.title,
        breadcrumbs: [{ title: '仪表盘', url: 'dashboards' }],
        children: [
          {
            active: activeChildId === 'manage-folder-dashboards',
            icon: 'fa fa-fw fa-th-large',
            id: 'manage-folder-dashboards',
            text: '仪表盘',
            url: folder.url,
          },
          {
            active: activeChildId === 'manage-folder-permissions',
            icon: 'fa fa-fw fa-lock',
            id: 'manage-folder-permissions',
            text: '权限',
            url: `${folder.url}/permissions`,
          },
          {
            active: activeChildId === 'manage-folder-settings',
            icon: 'fa fa-fw fa-cog',
            id: 'manage-folder-settings',
            text: '设置',
            url: `${folder.url}/settings`,
          },
        ],
      };

      self.main = NavItem.create(main);
    },

    initDatasourceEditNav(ds: any, plugin: any, currentPage: string) {
      let title = '新建';
      let subTitle = `类型: ${plugin.name}`;

      if (ds.id) {
        title = ds.name;
      }

      let main = {
        img: plugin.info.logos.large,
        id: 'ds-edit-' + plugin.id,
        subTitle: subTitle,
        url: '',
        text: title,
        breadcrumbs: [{ title: '数据源', url: 'datasources' }],
        children: [
          {
            active: currentPage === 'datasource-settings',
            icon: 'fa fa-fw fa-sliders',
            id: 'datasource-settings',
            text: '设置',
            url: `datasources/edit/${ds.id}`,
          },
        ],
      };

      const hasDashboards = _.find(plugin.includes, { type: 'dashboard' }) !== undefined;
      if (hasDashboards && ds.id) {
        main.children.push({
          active: currentPage === 'datasource-dashboards',
          icon: 'fa fa-fw fa-th-large',
          id: 'datasource-dashboards',
          text: '仪表盘',
          url: `datasources/edit/${ds.id}/dashboards`,
        });
      }

      self.main = NavItem.create(main);
    },

    initTeamPage(team: ITeam, tab: string, isSyncEnabled: boolean) {
      let main = {
        img: team.avatarUrl,
        id: 'team-' + team.id,
        subTitle: '组员和设置管理',
        url: '',
        text: team.name,
        breadcrumbs: [{ title: 'Teams', url: 'org/teams' }],
        children: [
          {
            active: tab === 'members',
            icon: 'gicon gicon-team',
            id: 'team-members',
            text: '组员',
            url: `org/teams/edit/${team.id}/members`,
          },
          {
            active: tab === 'settings',
            icon: 'fa fa-fw fa-sliders',
            id: 'team-settings',
            text: '设置',
            url: `org/teams/edit/${team.id}/settings`,
          },
        ],
      };

      if (isSyncEnabled) {
        main.children.splice(1, 0, {
          active: tab === 'groupsync',
          icon: 'fa fa-fw fa-refresh',
          id: 'team-settings',
          text: '外部组同步',
          url: `org/teams/edit/${team.id}/groupsync`,
        });
      }

      self.main = NavItem.create(main);
    },
  }));
