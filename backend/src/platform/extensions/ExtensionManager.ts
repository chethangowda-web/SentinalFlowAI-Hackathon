import { LoggerService } from '../../mastra/services/loggerService';

export interface ExtensionContext {
  platformVersion: string;
  services: Record<string, any>;
}

export interface IExtension {
  name: string;
  version: string;
  dependencies?: string[];
  onRegister?(context: ExtensionContext): Promise<void>;
  onBoot?(context: ExtensionContext): Promise<void>;
  onShutdown?(): Promise<void>;
}

export class ExtensionSandbox {
  public static async executeSafely(ext: IExtension, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[ExtensionSandbox] Error executing lifecycle for extension ${ext.name}: ${err.message}`);
    }
  }
}

export class ExtensionManager {
  private registry: Map<string, IExtension> = new Map();
  private loadedOrder: string[] = [];
  private log = new LoggerService('ExtensionManager');

  public register(ext: IExtension): void {
    if (this.registry.has(ext.name)) {
      throw new Error(`Extension already registered: ${ext.name}`);
    }
    this.registry.set(ext.name, ext);
    this.log.info(`[ExtensionManager] Extension registered: ${ext.name} (v${ext.version})`);
  }

  public async bootAll(context: ExtensionContext): Promise<void> {
    this.log.info('[ExtensionManager] Booting registered SRE extensions...');

    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (temp.has(name)) throw new Error(`Circular dependency detected involving extension: ${name}`);
      if (visited.has(name)) return;

      temp.add(name);
      const ext = this.registry.get(name);
      if (ext && ext.dependencies) {
        for (const dep of ext.dependencies) {
          if (!this.registry.has(dep)) {
            throw new Error(`Missing dependency "${dep}" for extension "${name}"`);
          }
          visit(dep);
        }
      }
      temp.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.registry.keys()) {
      visit(name);
    }

    this.loadedOrder = order;

    // Boot order
    for (const name of this.loadedOrder) {
      const ext = this.registry.get(name)!;
      if (ext.onRegister) {
        await ExtensionSandbox.executeSafely(ext, () => ext.onRegister!(context));
      }
      if (ext.onBoot) {
        await ExtensionSandbox.executeSafely(ext, () => ext.onBoot!(context));
      }
      this.log.info(`[ExtensionManager] Extension booted: ${ext.name}`);
    }
  }

  public async shutdownAll(): Promise<void> {
    this.log.info('[ExtensionManager] Shutting down registered extensions...');
    // Shutdown in reverse order
    for (let i = this.loadedOrder.length - 1; i >= 0; i--) {
      const name = this.loadedOrder[i];
      const ext = this.registry.get(name)!;
      if (ext.onShutdown) {
        await ExtensionSandbox.executeSafely(ext, () => ext.onShutdown!());
      }
      this.log.info(`[ExtensionManager] Extension shut down: ${ext.name}`);
    }
  }

  public getExtension(name: string): IExtension | undefined {
    return this.registry.get(name);
  }

  public listExtensions(): IExtension[] {
    return Array.from(this.registry.values());
  }
}

export const extensionManager = new ExtensionManager();
export default extensionManager;
