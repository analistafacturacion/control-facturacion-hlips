# Wireframes

## Barra superior
```mermaid
flowchart LR
  A[Barra superior fija] --> B(Título: Control Facturación)
  A --> C(Menu: Facturación | Anulaciones | Radicación | Medicamentos | Venta | Configuración | Control JSON)
  A --> D(Perfil/Logout)
```

## Sección: Facturación (lista)
```mermaid
flowchart TD
  H[Header: Facturación] --> F1[Filtros: fecha, estado, número]
  F1 --> L1[Tabla: Nº, Fecha, Cliente, Estado, Total, Acciones]
  L1 --> P[Paginar]
  L1 --> A1[Acción: Ver/Editar]
  L1 --> A2[Acción: Anular]
  H --> BN[Botón: Nueva Factura]
```

## Sección: Configuración
```mermaid
flowchart TD
  HC[Header: Configuración] --> C1[Parámetros generales]
  C1 --> F[Formulario: clave, valor, descripción]
  F --> S[Guardar cambios]
  HC --> R[Gestión de usuarios y roles]
  R --> U[Listado de usuarios]
  R --> RU[Asignar roles y permisos]
```
