import { TestBed } from '@angular/core/testing';
import { Router, RouterEvent } from '@angular/router';
import {
  routerReducer,
  RouterReducerState,
  StoreRouterConnectingModule,
  RouterAction,
  RouterState,
  RouterStateSerializer,
  MinimalRouterStateSerializer,
  DefaultRouterStateSerializer,
} from '@ngrx/router-store';
import { select, Store, ActionsSubject } from '@ngrx/store';
import { withLatestFrom, filter } from 'rxjs/operators';

import { createTestModule } from './utils';

describe('Router Store Module', () => {
  describe('with defining state key', () => {
    const customStateKey = 'router-reducer';
    let storeRouterConnectingModule: StoreRouterConnectingModule;
    let store: Store<State>;
    let router: Router;

    interface State {
      [customStateKey]: RouterReducerState;
    }

    beforeEach(() => {
      createTestModule({
        reducers: {
          [customStateKey]: routerReducer,
        },
        config: {
          stateKey: customStateKey,
        },
      });

      store = TestBed.get(Store);
      router = TestBed.get(Router);
      storeRouterConnectingModule = TestBed.get(StoreRouterConnectingModule);
    });

    it('should have custom state key as own property', () => {
      expect((<any>storeRouterConnectingModule).stateKey).toBe(customStateKey);
    });

    it('should call navigateIfNeeded with args selected by custom state key', (done: any) => {
      let logs: any[] = [];
      store
        .pipe(
          select(customStateKey),
          withLatestFrom(store)
        )
        .subscribe(([routerStoreState, storeState]) => {
          logs.push([routerStoreState, storeState]);
        });

      spyOn(
        storeRouterConnectingModule,
        'navigateIfNeeded' as never
      ).and.callThrough();
      logs = [];

      // this dispatches `@ngrx/router-store/navigation` action
      // and store emits its payload.
      router.navigateByUrl('/').then(() => {
        const actual = (<any>(
          storeRouterConnectingModule
        )).navigateIfNeeded.calls.allArgs();

        expect(actual.length).toBe(1);
        expect(actual[0]).toEqual(logs[0]);
        done();
      });
    });
  });

  describe('with defining state selector', () => {
    const customStateKey = 'routerReducer';
    const customStateSelector = (state: State) => state.routerReducer;

    let storeRouterConnectingModule: StoreRouterConnectingModule;
    let store: Store<State>;
    let router: Router;

    interface State {
      [customStateKey]: RouterReducerState;
    }

    beforeEach(() => {
      createTestModule({
        reducers: {
          [customStateKey]: routerReducer,
        },
        config: {
          stateKey: customStateSelector,
        },
      });

      store = TestBed.get(Store);
      router = TestBed.get(Router);
      storeRouterConnectingModule = TestBed.get(StoreRouterConnectingModule);
    });

    it('should have same state selector as own property', () => {
      expect((<any>storeRouterConnectingModule).stateKey).toBe(
        customStateSelector
      );
    });

    it('should call navigateIfNeeded with args selected by custom state selector', (done: any) => {
      let logs: any[] = [];
      store
        .pipe(
          select(customStateSelector),
          withLatestFrom(store)
        )
        .subscribe(([routerStoreState, storeState]) => {
          logs.push([routerStoreState, storeState]);
        });

      spyOn(
        storeRouterConnectingModule,
        'navigateIfNeeded' as never
      ).and.callThrough();
      logs = [];

      // this dispatches `@ngrx/router-store/navigation` action
      // and store emits its payload.
      router.navigateByUrl('/').then(() => {
        const actual = (<any>(
          storeRouterConnectingModule
        )).navigateIfNeeded.calls.allArgs();

        expect(actual.length).toBe(1);
        expect(actual[0]).toEqual(logs[0]);
        done();
      });
    });
  });

  describe('routerState', () => {
    function setup(routerState: RouterState, serializer?: any) {
      createTestModule({
        reducers: {},
        config: {
          routerState,
          serializer,
        },
      });

      return {
        actions: TestBed.get(ActionsSubject) as ActionsSubject,
        router: TestBed.get(Router) as Router,
        serializer: TestBed.get(RouterStateSerializer) as RouterStateSerializer,
      };
    }

    const onlyRouterActions = (a: any): a is RouterAction<any, any> =>
      a.payload && a.payload.event;

    describe('Full', () => {
      it('should dispatch the full event', async () => {
        const { actions, router } = setup(RouterState.Full);
        actions
          .pipe(filter(onlyRouterActions))
          .subscribe(({ payload }) =>
            expect(payload.event instanceof RouterEvent).toBe(true)
          );

        await router.navigateByUrl('/');
      });

      it('should use the default router serializer', () => {
        const { serializer } = setup(RouterState.Full);
        expect(serializer).toEqual(new DefaultRouterStateSerializer());
      });

      it('should use the provided serializer if one is provided', () => {
        const { serializer } = setup(
          RouterState.Full,
          MinimalRouterStateSerializer
        );
        expect(serializer).toEqual(new MinimalRouterStateSerializer());
      });
    });

    describe('Minimal', () => {
      it('should dispatch the navigation id with url', async () => {
        const { actions, router } = setup(RouterState.Minimal);
        actions
          .pipe(filter(onlyRouterActions))
          .subscribe(({ payload }: any) => {
            expect(payload.event instanceof RouterEvent).toBe(false);
            expect(payload.event).toEqual({ id: 1, url: '/' });
          });

        await router.navigateByUrl('/');
      });

      it('should use the minimal router serializer', () => {
        const { serializer } = setup(RouterState.Minimal);
        expect(serializer).toEqual(new MinimalRouterStateSerializer());
      });

      it('should use the provided serializer if one is provided', () => {
        const { serializer } = setup(
          RouterState.Minimal,
          DefaultRouterStateSerializer
        );
        expect(serializer).toEqual(new DefaultRouterStateSerializer());
      });
    });
  });
});
