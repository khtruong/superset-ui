import * as React from 'react';
import { createSelector } from 'reselect';
import getChartComponentRegistry from '../registries/ChartComponentRegistrySingleton';
import getChartTransformPropsRegistry from '../registries/ChartTransformPropsRegistrySingleton';
import ChartProps from '../models/ChartProps';
import createLoadableRenderer from './createLoadableRenderer';
import { ChartType } from '../models/ChartPlugin';
import { PreTransformProps, TransformProps, PostTransformProps } from '../types/TransformFunction';
import { HandlerFunction } from '../types/Base';

const IDENTITY = (x: any) => x;

const EMPTY = () => null;

/* eslint-disable sort-keys */
const defaultProps = {
  id: '',
  className: '',
  preTransformProps: IDENTITY,
  overrideTransformProps: undefined,
  postTransformProps: IDENTITY,
  onRenderSuccess() {},
  onRenderFailure() {},
};
/* eslint-enable sort-keys */

interface LoadingProps {
  error: any;
}

interface LoadedModules {
  Chart: ChartType;
  transformProps: TransformProps;
}

interface RenderProps {
  chartProps: ChartProps;
  preTransformProps?: PreTransformProps;
  postTransformProps?: PostTransformProps;
}

const BLANK_CHART_PROPS = new ChartProps();

export type Props = {
  id?: string;
  className?: string;
  chartProps?: ChartProps | null;
  chartType: string;
  preTransformProps?: PreTransformProps;
  overrideTransformProps?: TransformProps;
  postTransformProps?: PostTransformProps;
  onRenderSuccess?: HandlerFunction;
  onRenderFailure?: HandlerFunction;
};

export default class SuperChartCore extends React.PureComponent<Props, {}> {
  static defaultProps = defaultProps;

  /**
   * The HTML element that wraps all chart content
   */
  container?: HTMLElement | null;

  /**
   * memoized function so it will not recompute
   * and return previous value
   * unless one of
   * - preTransformProps
   * - transformProps
   * - postTransformProps
   * - chartProps
   * is changed.
   */
  processChartProps = createSelector(
    (input: {
      chartProps: ChartProps;
      preTransformProps?: PreTransformProps;
      transformProps?: TransformProps;
      postTransformProps?: PostTransformProps;
    }) => input.preTransformProps,
    input => input.transformProps,
    input => input.postTransformProps,
    input => input.chartProps,
    (pre = IDENTITY, transform = IDENTITY, post = IDENTITY, chartProps) =>
      post(transform(pre(chartProps))),
  );

  /**
   * memoized function so it will not recompute
   * and return previous value
   * unless one of
   * - chartType
   * - overrideTransformProps
   * is changed.
   */
  private createLoadableRenderer = createSelector(
    (input: { chartType: string; overrideTransformProps?: TransformProps }) => input.chartType,
    input => input.overrideTransformProps,
    (chartType, overrideTransformProps) => {
      if (chartType) {
        const Renderer = createLoadableRenderer({
          loader: {
            Chart: () => getChartComponentRegistry().getAsPromise(chartType),
            transformProps: overrideTransformProps
              ? () => Promise.resolve(overrideTransformProps)
              : () => getChartTransformPropsRegistry().getAsPromise(chartType),
          },
          loading: (loadingProps: LoadingProps) => this.renderLoading(loadingProps, chartType),
          render: this.renderChart,
        });

        // Trigger preloading.
        Renderer.preload();

        return Renderer;
      }

      return EMPTY;
    },
  );

  private renderChart = (loaded: LoadedModules, props: RenderProps) => {
    const { Chart, transformProps } = loaded;
    const { chartProps, preTransformProps, postTransformProps } = props;

    return (
      <Chart
        {...this.processChartProps({
          /* eslint-disable sort-keys */
          chartProps,
          preTransformProps,
          transformProps,
          postTransformProps,
          /* eslint-enable sort-keys */
        })}
      />
    );
  };

  private renderLoading = (loadingProps: LoadingProps, chartType: string) => {
    const { error } = loadingProps;

    if (error) {
      return (
        <div className="alert alert-warning" role="alert">
          <strong>ERROR</strong>&nbsp;
          <code>chartType=&quot;{chartType}&quot;</code> &mdash;
          {error.toString()}
        </div>
      );
    }

    return null;
  };

  private setRef = (container: HTMLElement | null) => {
    this.container = container;
  };

  render() {
    const {
      id,
      className,
      preTransformProps,
      postTransformProps,
      chartProps = BLANK_CHART_PROPS,
      onRenderSuccess,
      onRenderFailure,
    } = this.props;

    // Create LoadableRenderer and start preloading
    // the lazy-loaded Chart components
    const Renderer = this.createLoadableRenderer(this.props);

    // Do not render if chartProps is set to null.
    // but the pre-loading has been started in this.createLoadableRenderer
    // to prepare for rendering once chartProps becomes available.
    if (chartProps === null) {
      return null;
    }

    const containerProps: {
      id?: string;
      className?: string;
    } = {};
    if (id) {
      containerProps.id = id;
    }
    if (className) {
      containerProps.className = className;
    }

    return (
      <div {...containerProps} ref={this.setRef}>
        <Renderer
          preTransformProps={preTransformProps}
          postTransformProps={postTransformProps}
          chartProps={chartProps}
          onRenderSuccess={onRenderSuccess}
          onRenderFailure={onRenderFailure}
        />
      </div>
    );
  }
}
