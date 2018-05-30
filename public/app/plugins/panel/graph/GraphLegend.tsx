import { react2AngularDirective } from 'app/core/utils/react2angular';
import React, { PureComponent } from 'react';
import { GraphCtrl } from './module';

const LegendItem = ({ series }) => (
  <div className="graph-legend-series">
    <div className="graph-legend-icon">
      <i className="fa fa-minus pointer" style={{ color: series.color }} />
    </div>
    <a className="graph-legend-alias pointer">{series.alias}</a>
  </div>
);

interface Props {
  ctrl: GraphCtrl;
}

export default class Legend extends PureComponent<Props, any> {
  render() {
    const className = 'asd';
    const { ctrl } = this.props;
    const data = [];
    console.log('legend render', ctrl);
    const items = data || [];
    return (
      <div className={`${className} graph-legend ps`}>
        <div className="graph-legend-content">
          {items.map(series => <LegendItem key={series.id} series={series} />)}
        </div>
      </div>
    );
  }
}

console.log('react 2 angular');
react2AngularDirective('graphLegend', Legend, [['ctrl', { watchDepth: 'reference' }]]);
