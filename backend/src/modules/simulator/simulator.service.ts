// src/modules/simulator/simulator.service.ts
import { SimulationMode } from '../../shared/enums';
import { DependencyResult } from '../../shared/types';

export class DependencySimulator {
  private static mode: SimulationMode = SimulationMode.SUCCESS;

  static getMode(): SimulationMode {
    return this.mode;
  }

  static setMode(mode: SimulationMode | string): void {
    if (mode === 'FAIL' || mode === SimulationMode.TEMPORARY_FAILURE) {
      this.mode = SimulationMode.TEMPORARY_FAILURE;
    } else if (mode === 'TIMEOUT') {
      this.mode = SimulationMode.TEMPORARY_FAILURE;
    } else if (mode === SimulationMode.PERMANENT_FAILURE) {
      this.mode = SimulationMode.PERMANENT_FAILURE;
    } else {
      this.mode = SimulationMode.SUCCESS;
    }
  }

  static async verify(_payload: unknown): Promise<DependencyResult> {
    switch (this.mode) {
      case SimulationMode.SUCCESS:
        return {
          success: true,
          message: 'External verification successful',
          retryable: false,
        };

      case SimulationMode.TEMPORARY_FAILURE:
        return {
          success: false,
          message: 'External verification service temporarily unavailable (timeout/error)',
          retryable: true,
        };

      case SimulationMode.PERMANENT_FAILURE:
        return {
          success: false,
          message: 'External verification permanently failed',
          retryable: false,
        };

      default:
        return {
          success: true,
          message: 'External verification successful',
          retryable: false,
        };
    }
  }
}
