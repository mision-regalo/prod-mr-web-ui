/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeployedEnv = 'PROD' | 'UAT' | 'DEV';

const VALID_ENVS: DeployedEnv[] = ['PROD', 'UAT', 'DEV'];

// Resolve the deployment environment from DEPLOYED_ENV (exposed via vite.config.ts envPrefix).
// Defaults to PROD when unset or invalid, so missing configuration fails safe.
export function getDeployedEnv(): DeployedEnv {
  const raw = (import.meta.env.DEPLOYED_ENV || '').toString().toUpperCase();
  return VALID_ENVS.includes(raw as DeployedEnv) ? (raw as DeployedEnv) : 'PROD';
}

export function isProdEnv(): boolean {
  return getDeployedEnv() === 'PROD';
}

// Generic flag reader for SHOW_* feature-visibility env vars.
// Defaults to 'N' (hidden) when unset, so menu items stay hidden unless explicitly enabled.
function readShowFlag(value: string | undefined): boolean {
  return (value || 'N').toString().trim().toUpperCase() === 'Y';
}

export function isReasignacionManualVisible(): boolean {
  return readShowFlag(import.meta.env.SHOW_REASIGNACION);
}

export function isSimularReasignacionVisible(): boolean {
  return readShowFlag(import.meta.env.SHOW_SIMULAR_REASIGNACION);
}

export function isRecordatoriosVisible(): boolean {
  return readShowFlag(import.meta.env.SHOW_RECORDATORIOS);
}

export function isArchivoVisible(): boolean {
  return readShowFlag(import.meta.env.SHOW_ARCHIVO);
}
