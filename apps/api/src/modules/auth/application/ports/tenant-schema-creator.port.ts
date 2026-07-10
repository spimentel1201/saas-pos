/**
 * Puerto de creacion de schemas tenant (clinica del script create-schema.ts).
 * Lo usa el use-case SignupUseCase aislando la implementacion SQL.
 */
export interface TenantSchemaCreatorPort {
  create(schemaName: string): Promise<void>;
}
