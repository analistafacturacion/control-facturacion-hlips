// Almacén en memoria para credenciales de Pergamo por usuario (por ejemplo, por userId)
// ¡No persistente! Se borra al reiniciar el backend

interface PergamoCredenciales {
  user: string;
  pass: string;
  token: string;
}

const pergamoStore: Record<string, PergamoCredenciales> = {};

export function setPergamoCredenciales(userId: string, cred: PergamoCredenciales) {
  pergamoStore[userId] = cred;
}

export function getPergamoCredenciales(userId: string): PergamoCredenciales | undefined {
  return pergamoStore[userId];
}

export function clearPergamoCredenciales(userId: string) {
  delete pergamoStore[userId];
}
