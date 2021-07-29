/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Browser, BrowserContext, BrowserContextOptions, Page, LaunchOptions, ViewportSize, Geolocation, HTTPCredentials } from './types';
import type { Expect } from './testExpect';

export type { Expect } from './testExpect';

export type ReporterDescription =
  ['dot'] |
  ['line'] |
  ['list'] |
  ['junit'] | ['junit', { outputFile?: string, stripANSIControlSequences?: boolean }] |
  ['json'] | ['json', { outputFile?: string }] |
  ['null'] |
  [string] | [string, any];

export type Shard = { total: number, current: number } | null;
export type ReportSlowTests = { max: number, threshold: number } | null;
export type PreserveOutput = 'always' | 'never' | 'failures-only';
export type UpdateSnapshots = 'all' | 'none' | 'missing';

type FixtureDefine<TestArgs extends KeyValue = {}, WorkerArgs extends KeyValue = {}> = { test: TestType<TestArgs, WorkerArgs>, fixtures: Fixtures<{}, {}, TestArgs, WorkerArgs> };

type ExpectSettings = {
  toMatchSnapshot?: {
    // Pixel match threshold.
    threshold?: number
  }
};

interface TestProject {
  expect?: ExpectSettings;
  metadata?: any;
  name?: string;
  outputDir?: string;
  repeatEach?: number;
  retries?: number;
  testDir?: string;
  testIgnore?: string | RegExp | (string | RegExp)[];
  testMatch?: string | RegExp | (string | RegExp)[];
  timeout?: number;
}

export interface Project<TestArgs = {}, WorkerArgs = {}> extends TestProject {
  define?: FixtureDefine | FixtureDefine[];
  use?: Fixtures<{}, {}, TestArgs, WorkerArgs>;
}

export type FullProject<TestArgs = {}, WorkerArgs = {}> = Required<Project<TestArgs, WorkerArgs>>;

export type LaunchConfig = {
  /**
   * Shell command to start. For example `npm run start`.
   */
  command: string,
  /**
   * The port that your http server is expected to appear on. If specified it does wait until it accepts connections.
   */
  waitForPort?: number,
  /**
   * How long to wait for the process to start up and be available in milliseconds. Defaults to 60000.
   */
  waitForPortTimeout?: number,
  /**
   * If true it will verify that the given port via `waitForPort` is available and throw otherwise.
   * This should commonly set to !!process.env.CI to allow the local dev server when running tests locally.
   */
  strict?: boolean
  /**
   * Environment variables, process.env by default
   */
  env?: Record<string, string>,
  /**
   * Current working directory of the spawned process. Default is process.cwd().
   */
  cwd?: string,
};

type LiteralUnion<T extends U, U = string> = T | (U & { zz_IGNORE_ME?: never });

interface TestConfig {
  forbidOnly?: boolean;
  globalSetup?: string;
  globalTeardown?: string;
  globalTimeout?: number;
  grep?: RegExp | RegExp[];
  grepInvert?: RegExp | RegExp[];
  maxFailures?: number;
  preserveOutput?: PreserveOutput;
  projects?: Project[];
  quiet?: boolean;
  reporter?: LiteralUnion<'list'|'dot'|'line'|'json'|'junit'|'null', string> | ReporterDescription[];
  reportSlowTests?: ReportSlowTests;
  shard?: Shard;
  updateSnapshots?: UpdateSnapshots;
  _launch?: LaunchConfig | LaunchConfig[];
  workers?: number;

  expect?: ExpectSettings;
  metadata?: any;
  name?: string;
  outputDir?: string;
  repeatEach?: number;
  retries?: number;
  testDir?: string;
  testIgnore?: string | RegExp | (string | RegExp)[];
  testMatch?: string | RegExp | (string | RegExp)[];
  timeout?: number;
}

export interface Config<TestArgs = {}, WorkerArgs = {}> extends TestConfig {
  projects?: Project<TestArgs, WorkerArgs>[];
  define?: FixtureDefine | FixtureDefine[];
  use?: Fixtures<{}, {}, TestArgs, WorkerArgs>;
}

export interface FullConfig {
  forbidOnly: boolean;
  globalSetup: string | null;
  globalTeardown: string | null;
  globalTimeout: number;
  grep: RegExp | RegExp[];
  grepInvert: RegExp | RegExp[] | null;
  maxFailures: number;
  preserveOutput: PreserveOutput;
  projects: FullProject[];
  reporter: ReporterDescription[];
  reportSlowTests: ReportSlowTests;
  rootDir: string;
  quiet: boolean;
  shard: Shard;
  updateSnapshots: UpdateSnapshots;
  workers: number;
  _launch: LaunchConfig[];
}

export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped';

export interface TestError {
  message?: string;
  stack?: string;
  value?: string;
}

export interface WorkerInfo {
  config: FullConfig;
  project: FullProject;
  workerIndex: number;
}

export interface TestInfo {
  config: FullConfig;
  project: FullProject;
  workerIndex: number;

  title: string;
  file: string;
  line: number;
  column: number;
  fn: Function;

  skip(): void;
  skip(condition: boolean): void;
  skip(condition: boolean, description: string): void;

  fixme(): void;
  fixme(condition: boolean): void;
  fixme(condition: boolean, description: string): void;

  fail(): void;
  fail(condition: boolean): void;
  fail(condition: boolean, description: string): void;

  slow(): void;
  slow(condition: boolean): void;
  slow(condition: boolean, description: string): void;

  setTimeout(timeout: number): void;
  expectedStatus: TestStatus;
  timeout: number;
  annotations: { type: string, description?: string }[];
  attachments: { name: string, path?: string, body?: Buffer, contentType: string }[];
  repeatEachIndex: number;
  retry: number;
  duration: number;
  status?: TestStatus;
  error?: TestError;
  stdout: (string | Buffer)[];
  stderr: (string | Buffer)[];
  snapshotSuffix: string;
  outputDir: string;
  snapshotPath: (snapshotName: string) => string;
  outputPath: (...pathSegments: string[]) => string;
}

interface SuiteFunction {
  (title: string, callback: () => void): void;
}

interface TestFunction<TestArgs> {
  (title: string, testFunction: (args: TestArgs, testInfo: TestInfo) => Promise<void> | void): void;
}

export interface TestType<TestArgs extends KeyValue, WorkerArgs extends KeyValue> extends TestFunction<TestArgs & WorkerArgs> {
  only: TestFunction<TestArgs & WorkerArgs>;
  describe: SuiteFunction & {
    only: SuiteFunction;
  };
  skip(): void;
  skip(condition: boolean): void;
  skip(condition: boolean, description: string): void;
  skip(callback: (args: TestArgs & WorkerArgs) => boolean): void;
  skip(callback: (args: TestArgs & WorkerArgs) => boolean, description: string): void;
  fixme(): void;
  fixme(condition: boolean): void;
  fixme(condition: boolean, description: string): void;
  fixme(callback: (args: TestArgs & WorkerArgs) => boolean): void;
  fixme(callback: (args: TestArgs & WorkerArgs) => boolean, description: string): void;
  fail(): void;
  fail(condition: boolean): void;
  fail(condition: boolean, description: string): void;
  fail(callback: (args: TestArgs & WorkerArgs) => boolean): void;
  fail(callback: (args: TestArgs & WorkerArgs) => boolean, description: string): void;
  slow(): void;
  slow(condition: boolean): void;
  slow(condition: boolean, description: string): void;
  slow(callback: (args: TestArgs & WorkerArgs) => boolean): void;
  slow(callback: (args: TestArgs & WorkerArgs) => boolean, description: string): void;
  setTimeout(timeout: number): void;
  beforeEach(inner: (args: TestArgs & WorkerArgs, testInfo: TestInfo) => Promise<any> | any): void;
  afterEach(inner: (args: TestArgs & WorkerArgs, testInfo: TestInfo) => Promise<any> | any): void;
  beforeAll(inner: (args: WorkerArgs, workerInfo: WorkerInfo) => Promise<any> | any): void;
  afterAll(inner: (args: WorkerArgs, workerInfo: WorkerInfo) => Promise<any> | any): void;
  use(fixtures: Fixtures<{}, {}, TestArgs, WorkerArgs>): void;
  expect: Expect;
  declare<T extends KeyValue = {}, W extends KeyValue = {}>(): TestType<TestArgs & T, WorkerArgs & W>;
  extend<T, W extends KeyValue = {}>(fixtures: Fixtures<T, W, TestArgs, WorkerArgs>): TestType<TestArgs & T, WorkerArgs & W>;
}

type KeyValue = { [key: string]: any };
export type TestFixture<R, Args extends KeyValue> = (args: Args, use: (r: R) => Promise<void>, testInfo: TestInfo) => any;
export type WorkerFixture<R, Args extends KeyValue> = (args: Args, use: (r: R) => Promise<void>, workerInfo: WorkerInfo) => any;
type TestFixtureValue<R, Args> = R | TestFixture<R, Args>;
type WorkerFixtureValue<R, Args> = R | WorkerFixture<R, Args>;
export type Fixtures<T extends KeyValue = {}, W extends KeyValue = {}, PT extends KeyValue = {}, PW extends KeyValue = {}> = {
  [K in keyof PW]?: WorkerFixtureValue<PW[K], W & PW>;
} & {
  [K in keyof PT]?: TestFixtureValue<PT[K], T & W & PT & PW>;
} & {
  [K in keyof W]?: [WorkerFixtureValue<W[K], W & PW>, { scope: 'worker', auto?: boolean }];
} & {
  [K in keyof T]?: TestFixtureValue<T[K], T & W & PT & PW> | [TestFixtureValue<T[K], T & W & PT & PW>, { scope?: 'test', auto?: boolean }];
};

type BrowserName = 'chromium' | 'firefox' | 'webkit';
type BrowserChannel = Exclude<LaunchOptions['channel'], undefined>;
type ColorScheme = Exclude<BrowserContextOptions['colorScheme'], undefined>;
type ExtraHTTPHeaders = Exclude<BrowserContextOptions['extraHTTPHeaders'], undefined>;
type Proxy = Exclude<BrowserContextOptions['proxy'], undefined>;
type StorageState = Exclude<BrowserContextOptions['storageState'], undefined>;

export interface PlaywrightWorkerOptions {
  browserName: BrowserName;
  defaultBrowserType: BrowserName;
  headless: boolean | undefined;
  channel: BrowserChannel | undefined;
  launchOptions: LaunchOptions;
}

export type VideoMode = 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' | /** deprecated */ 'retry-with-video';

export interface PlaywrightTestOptions {
  screenshot: 'off' | 'on' | 'only-on-failure';
  trace: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' | /** deprecated */ 'retry-with-trace';
  video: VideoMode | { mode: VideoMode, size: ViewportSize };
  acceptDownloads: boolean | undefined;
  bypassCSP: boolean | undefined;
  colorScheme: ColorScheme | undefined;
  deviceScaleFactor: number | undefined;
  extraHTTPHeaders: ExtraHTTPHeaders | undefined;
  geolocation: Geolocation | undefined;
  hasTouch: boolean | undefined;
  httpCredentials: HTTPCredentials | undefined;
  ignoreHTTPSErrors: boolean | undefined;
  isMobile: boolean | undefined;
  javaScriptEnabled: boolean | undefined;
  locale: string | undefined;
  offline: boolean | undefined;
  permissions: string[] | undefined;
  proxy: Proxy | undefined;
  storageState: StorageState | undefined;
  timezoneId: string | undefined;
  userAgent: string | undefined;
  viewport: ViewportSize | null | undefined;
  baseURL: string | undefined;
  contextOptions: BrowserContextOptions;
}


export interface PlaywrightWorkerArgs {
  playwright: typeof import('..');
  browser: Browser;
}

export interface PlaywrightTestArgs {
  createContext: (options?: BrowserContextOptions) => Promise<BrowserContext>;
  context: BrowserContext;
  page: Page;
}

export type PlaywrightTestProject<TestArgs = {}, WorkerArgs = {}> = Project<PlaywrightTestOptions & TestArgs, PlaywrightWorkerOptions & WorkerArgs>;
export type PlaywrightTestConfig<TestArgs = {}, WorkerArgs = {}> = Config<PlaywrightTestOptions & TestArgs, PlaywrightWorkerOptions & WorkerArgs>;

/**
 * These tests are executed in Playwright environment that launches the browser
 * and provides a fresh page to each test.
 */
export const test: TestType<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>;
export default test;

export const _baseTest: TestType<{}, {}>;
export const expect: Expect;

// This is required to not export everything by default. See https://github.com/Microsoft/TypeScript/issues/19545#issuecomment-340490459
export {};
