// src/modules/simulator/simulator.controller.ts
import { Request, Response, NextFunction } from 'express';
import { DependencySimulator } from './simulator.service';
import { success } from '../../shared/utils/response';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError';

export const updateSimulatorSchema = z.object({
  mode: z.enum(['SUCCESS', 'TEMPORARY_FAILURE', 'PERMANENT_FAILURE', 'FAIL', 'TIMEOUT']),
});

export async function getSimulatorHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mode = DependencySimulator.getMode();
    success(res, { mode }, 'Simulator configuration retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function updateSimulatorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { mode } = req.body;
    DependencySimulator.setMode(mode);
    const updatedMode = DependencySimulator.getMode();
    success(res, { mode: updatedMode }, 'Simulator mode updated', 200);
  } catch (err) {
    next(err);
  }
}
