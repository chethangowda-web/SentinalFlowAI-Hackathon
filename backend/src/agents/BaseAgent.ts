import { LoggerService } from '../mastra/services/loggerService';

export enum AgentState {
  CREATED = 'CREATED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  RESUMING = 'RESUMING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
  RECOVERING = 'RECOVERING'
}

export interface AgentContext {
  traceId?: string;
  [key: string]: any;
}

export abstract class BaseAgent {
  public id: string;
  public name: string;
  protected state: AgentState = AgentState.CREATED;
  protected log: LoggerService;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.log = new LoggerService(`Agent:${name}`);
  }

  public getState(): AgentState {
    return this.state;
  }

  protected setState(newState: AgentState): void {
    this.log.info(`State transition: ${this.state} -> ${newState}`);
    this.state = newState;
  }

  public async initialize(context?: AgentContext): Promise<void> {
    this.setState(AgentState.INITIALIZING);
    try {
      await this.doInitialize(context);
      this.setState(AgentState.READY);
    } catch (err: any) {
      this.log.error(`Initialization failed: ${err.message}`);
      this.setState(AgentState.FAILED);
      throw err;
    }
  }

  public async execute(context?: AgentContext): Promise<any> {
    if (this.state !== AgentState.READY && this.state !== AgentState.RESUMING) {
      throw new Error(`Cannot execute from state ${this.state}`);
    }
    this.setState(AgentState.RUNNING);
    try {
      const result = await this.doExecute(context);
      this.setState(AgentState.READY);
      return result;
    } catch (err: any) {
      this.log.error(`Execution failed: ${err.message}`);
      this.setState(AgentState.FAILED);
      throw err;
    }
  }

  public async pause(): Promise<void> {
    if (this.state !== AgentState.RUNNING && this.state !== AgentState.READY) return;
    this.setState(AgentState.PAUSED);
    await this.doPause();
  }

  public async resume(): Promise<void> {
    if (this.state !== AgentState.PAUSED) return;
    this.setState(AgentState.RESUMING);
    await this.doResume();
    this.setState(AgentState.READY);
  }

  public async shutdown(): Promise<void> {
    this.setState(AgentState.STOPPING);
    await this.doShutdown();
    this.setState(AgentState.STOPPED);
  }

  public async recover(): Promise<void> {
    if (this.state !== AgentState.FAILED) return;
    this.setState(AgentState.RECOVERING);
    try {
      await this.doRecover();
      this.setState(AgentState.READY);
    } catch (err: any) {
      this.log.error(`Recovery failed: ${err.message}`);
      this.setState(AgentState.FAILED);
      throw err;
    }
  }

  public health(): { isHealthy: boolean; state: AgentState } {
    return {
      isHealthy: this.state !== AgentState.FAILED,
      state: this.state
    };
  }

  public collectMetrics(): Record<string, number> {
    return {};
  }

  protected abstract doInitialize(context?: AgentContext): Promise<void>;
  protected abstract doExecute(context?: AgentContext): Promise<any>;
  protected async doPause(): Promise<void> {}
  protected async doResume(): Promise<void> {}
  protected async doShutdown(): Promise<void> {}
  protected async doRecover(): Promise<void> {}
}
