import appEvents from 'app/core/app_events';
import locationUtil from 'app/core/utils/location_util';

export class CreateFolderCtrl {
  title = '';
  navModel: any;
  titleTouched = false;
  hasValidationError: boolean;
  validationError: any;

  /** @ngInject **/
  constructor(private backendSrv, private $location, private validationSrv, navModelSrv) {
    this.navModel = navModelSrv.getNav('dashboards', 'manage-dashboards', 0);
  }

  create() {
    if (this.hasValidationError) {
      return;
    }

    return this.backendSrv.createFolder({ title: this.title }).then(result => {
      appEvents.emit('alert-success', ['文件夹已创建成功', '确定']);
      this.$location.url(locationUtil.stripBaseFromUrl(result.url));
    });
  }

  titleChanged() {
    this.titleTouched = true;

    this.validationSrv
      .validateNewFolderName(this.title)
      .then(() => {
        this.hasValidationError = false;
      })
      .catch(err => {
        this.hasValidationError = true;
        this.validationError = err.message;
      });
  }
}
