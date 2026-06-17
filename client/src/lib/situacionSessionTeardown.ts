/**
 * Teardown imperativo del ring / desglosador situacional.
 * Debe ejecutarse ANTES de modales de victoria y al desmontar VehicleCard.
 */

import {
  cancelAllUbicacionVoice,
  cancelUbicacionVoiceForVehicle,
} from "./ubicacionVoiceReliable";
import { flushLocalVehicles } from "./persistence";
import { cancelSpeechSynthesisHard } from "./speechQueue";
import { extendLocalVehicleMutation } from "./localMutationLock";
import {
  listSituacionSessionVehicleIds,
  resetSituacionSessionTeardownGate,
  runSituacionSessionCleanups,
  registerSituacionSessionCleanup,
} from "./situacionSessionRegistry";

export {
  registerSituacionSessionCleanup,
  resetSituacionSessionTeardownGate,
};

export function teardownSituacionSession(vehicleId: string): void {
  if (!runSituacionSessionCleanups(vehicleId)) return;

  extendLocalVehicleMutation("teardown");
  cancelUbicacionVoiceForVehicle(vehicleId);
  flushLocalVehicles();
}

export function teardownAllSituacionSessions(): void {
  for (const vehicleId of listSituacionSessionVehicleIds()) {
    tornDownIdsResetAndTeardown(vehicleId);
  }
  cancelAllUbicacionVoice();
  cancelSpeechSynthesisHard();
  flushLocalVehicles();
}

function tornDownIdsResetAndTeardown(vehicleId: string): void {
  resetSituacionSessionTeardownGate(vehicleId);
  teardownSituacionSession(vehicleId);
}
