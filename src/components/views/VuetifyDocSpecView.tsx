import React, { useState } from 'react';
import { Language } from '../../i18n/translations';
import {
  FileCode2,
  Copy,
  Check,
  Layers,
  Code2,
  BookOpen,
  Layout,
  ShieldCheck,
  Palette,
  ExternalLink,
} from 'lucide-react';

interface VuetifyDocSpecViewProps {
  language: Language;
}

export const VuetifyDocSpecView: React.FC<VuetifyDocSpecViewProps> = ({ language }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const markdownFullSpec = `# Especificación de Diseño UI en Vuetify 3 - Misión Presentes GDL

## 1. Arquitectura General de Componentes Vuetify
- **Contenedor Principal**: \`<v-app>\`
- **Barra Superior**: \`<v-app-bar elevation="1" density="compact">\`
  - Logo institucional y título
  - Conmutador de rol (\`<v-btn-toggle v-model="currentRole">\` con Admin, Líder, Coordinador)
  - Perfil Google Auth del usuario
- **Navegación Lateral**: \`<v-navigation-drawer v-model="drawer" permanent>\`
  - Menú con las 5 fases del proceso de negocio
  - Badges con conteo de pendientes (\`<v-badge color="error">\`)
- **Contenedor de Vistas**: \`<v-main>\` con \`<v-container fluid>\`

---

## 2. Pantalla: Gestión de Cartas (Fase 1 y 2)
### Componentes Vuetify:
- \`<v-data-table-server>\`: Tabla con paginación, ordenamiento y búsqueda reactiva.
- \`<v-text-field variant="outlined" density="compact" prepend-inner-icon="mdi-magnify">\`: Búsqueda en vivo.
- \`<v-select>\`: Filtros por Escuela, Líder, Coordinador (condicionado por permiso SCC).
- \`<v-chip-group>\`: Filtros rápidos por estado (Sin Donante, Sin Regalo, Cumplida, Excedente).
- \`<v-dialog v-model="registerDialog" max-width="650px">\`: Modal para registro de carta con cálculo automático de ID (\`<1 char equipo><2 char comunidad><001>\`).
- \`<v-dialog v-model="giftDialog">\`: Registro de regalo en centro de acopio con rango de edad (\`3-6, 6-9, 9-12, 3-12\`), género y grado de coincidencia (\`specific, vague, mismatch\`).

\`\`\`vue
<!-- Ejemplo Vue 3 + Vuetify 3: Tabla de Cartas -->
<template>
  <v-card elevation="1" rounded="lg">
    <v-card-title class="d-flex align-center justify-space-between py-3 px-4">
      <span class="text-subtitle-1 font-weight-bold">Registro de Cartas</span>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewLetterDialog">
        Nueva Carta
      </v-btn>
    </v-card-title>
    
    <v-divider />

    <v-data-table
      :headers="tableHeaders"
      :items="filteredLetters"
      density="comfortable"
      hover
    >
      <template #item.id="{ item }">
        <v-chip size="small" variant="tonal" class="font-weight-mono">
          {{ item.id }}
        </v-chip>
      </template>

      <template #item.toyRequest="{ item }">
        <div class="d-flex align-center gap-1">
          <v-icon color="amber-darken-2" size="small">mdi-star</v-icon>
          <span class="font-weight-medium">{{ item.toyRequest }}</span>
        </div>
      </template>

      <template #item.presents="{ item }">
        <v-chip
          size="small"
          :color="getPresentsBadgeColor(item.presents.length)"
          class="font-weight-bold"
        >
          {{ item.presents.length }}
        </v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>
\`\`\`

---

## 3. Pantalla: Reasignación Manual de Regalos (Fase 4)
### Especificación del Modal "Crear Coincidencia":
Modal de pantalla ancha dividido horizontalmente en 2 columnas:
1. **The Target (El Destino)** [Izquierda]:
   - Filtros: ID, Nombre, Edad, Género, Escuela, Coincidencia, Donante, Coordinador, Líder.
   - Botón de búsqueda.
   - Tabla de resultados: Regalos (0), ID, Nombre, Edad, Género, Peticiones (Juguete, Ropa, Útil), Líder, Coordinador.
2. **The Source (El Origen)** [Derecha]:
   - Filtros: ID, Regalos restantes, Tipo de regalo, Rango de edad, Género, Coincidencia, Donante, Coordinador, Líder.
   - Botón de búsqueda.
   - Tabla de resultados: Regalo a reasignar, Origen (Regalos restantes, Líder, Coordinador), campo de texto \`Reasignar a\` (captura ID destino).
3. **Regla de Activación**:
   - Al capturar o seleccionar el ID de la carta destino en la fila de origen, se habilita el botón \`Reasignar\`.
   - Al hacer clic, se ejecuta la transferencia.

\`\`\`vue
<!-- Estructura del Modal Dividido en Vuetify 3 -->
<template>
  <v-dialog v-model="matchDialog" max-width="1200px" scrollable>
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">
        Crear Coincidencia de Reasignación
      </v-card-title>
      <v-card-text>
        <v-row>
          <!-- Columna Izquierda: El Destino -->
          <v-col cols="12" md="6" class="border-e">
            <h4 class="text-subtitle-2 text-error font-weight-bold mb-2">
              El Destino (Cartas con 0 Regalos)
            </h4>
            <!-- Filtros de Destino -->
            <v-row dense>
              <v-col cols="4"><v-text-field v-model="targetFilter.id" label="ID" density="compact" /></v-col>
              <v-col cols="4"><v-text-field v-model="targetFilter.name" label="Nombre" density="compact" /></v-col>
              <v-col cols="4"><v-btn color="primary" block @click="searchTarget">Buscar</v-btn></v-col>
            </v-row>
            <!-- Tabla Destino -->
            <v-table density="compact" class="mt-2">
              <!-- Resultados con botón para seleccionar ID -->
            </v-table>
          </v-col>

          <!-- Columna Derecha: El Origen -->
          <v-col cols="12" md="6">
            <h4 class="text-subtitle-2 text-primary font-weight-bold mb-2">
              El Origen (Regalos Disponibles / Excedentes)
            </h4>
            <!-- Filtros de Origen -->
            <v-row dense>
              <v-col cols="4"><v-text-field v-model="sourceFilter.id" label="ID Carta" density="compact" /></v-col>
              <v-col cols="4"><v-select v-model="sourceFilter.type" :items="['Juguete', 'Ropa', 'Útil']" label="Tipo" density="compact" /></v-col>
              <v-col cols="4"><v-btn color="secondary" block @click="searchSource">Buscar</v-btn></v-col>
            </v-row>
            <!-- Tabla Origen con input "Reasignar a" -->
            <v-table density="compact" class="mt-2">
              <!-- Fila con input reassignToId y botón Reasignar -->
            </v-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
\`\`\`

---

## 4. Matriz de Autorización y Permisos (RBAC)
| Código | Acción Permitida | Admin | Líder | Coordinador |
| :--- | :--- | :---: | :---: | :---: |
| **CL** | CRUD Líderes | **S** | N | N |
| **CC** | CRUD Coordinadores | **S** | **S** | N |
| **CD** | CRUD Donantes / Padrinos | **S** | **S** | **S** |
| **CLett** | CRUD Cartas | **S** | **S** | **S** |
| **RP** | Reasignar Regalos (Simulado / Manual) | **S** | **S** | N |
| **SWR** | Enviar Recordatorio WhatsApp | **S** | N | N |
| **SER** | Enviar Recordatorio Correo Electrónico | **S** | N | N |
| **SCC** | Ver Columna / Filtro Coordinador | **S** | **S** | N |

### Reglas Críticas de Integridad:
1. Un Líder **no puede ser eliminado** si tiene Coordinadores asignados.
2. Un Coordinador **no puede ser eliminado** si tiene cartas asignadas.
3. Un Donante **no puede ser eliminado** si tiene cartas asignadas.
4. Las cartas borradas por Líderes se trasladan al **Área de Archivo** (soft-delete recuperable).
`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Documento Técnico y Guía de Interfaz</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Guía de Diseño UI en Vuetify 3 para el Documento
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Diseño listo para incorporar a la especificación funcional y técnica de Misión Presentes. Incluye componentes Vuetify, código Vue 3, layout del modal y reglas de negocio.
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(markdownFullSpec, 'all')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all shrink-0"
        >
          {copiedSection === 'all' ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Copiado al Portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Especificación Completa (Markdown)</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Layout & Shell */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h3 className="font-bold text-slate-900 text-sm">App Shell & Navegación</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Estructurado con <code>&lt;v-app&gt;</code>, <code>&lt;v-app-bar&gt;</code> y <code>&lt;v-navigation-drawer&gt;</code>. El drawer refleja el avance de las 5 fases y muestra alertas de pendientes.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
            v-app · v-app-bar · v-navigation-drawer · v-badge
          </div>
        </div>

        {/* Card 2: Letters & Forms */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Registro de Cartas y Regalos</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Formulario con ID consecutivo automático por equipo y comunidad. Prioridad visible para Juguete y registro de acopio con escala de coincidencia.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
            v-dialog · v-text-field · v-select · v-chip
          </div>
        </div>

        {/* Card 3: Reassignment Engine */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Reasignación (Simulación & Manual)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Modal dividido en 2 columnas: "The Target" y "The Source". Búsqueda cruzada con activación automática del botón Reasignar al vincular IDs.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
            v-row · v-col · v-data-table · v-btn
          </div>
        </div>
      </div>

      {/* Security & RBAC Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Matriz de Roles y Permisos (RBAC del Documento)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Reglas exactas de autorización definidas en el caso de negocio.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="p-3">ID Permiso</th>
                <th className="p-3">Acción Permitida</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Líder</th>
                <th className="p-3 text-center">Coordinador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="p-3 font-bold text-slate-900">CL</td>
                <td className="p-3 font-sans text-slate-700">CRUD Líderes</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">CC</td>
                <td className="p-3 font-sans text-slate-700">CRUD Coordinadores</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">CD</td>
                <td className="p-3 font-sans text-slate-700">CRUD Donantes</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">CLett</td>
                <td className="p-3 font-sans text-slate-700">CRUD Cartas</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">RP</td>
                <td className="p-3 font-sans text-slate-700">Reasignar Regalos</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">SWR</td>
                <td className="p-3 font-sans text-slate-700">Enviar Recordatorio WhatsApp</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">SER</td>
                <td className="p-3 font-sans text-slate-700">Enviar Recordatorio Correo</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">SCC</td>
                <td className="p-3 font-sans text-slate-700">Ver Columna / Filtro Coordinador en Reportes</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center font-bold text-emerald-600">Y</td>
                <td className="p-3 text-center text-slate-400">N</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Plantilla Vue 3 + Vuetify 3 (Listos para Implementar)
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(markdownFullSpec, 'snippets')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar fragmentos</span>
          </button>
        </div>

        <pre className="text-xs font-mono bg-slate-950 p-4 rounded-lg overflow-x-auto text-slate-300 leading-relaxed border border-slate-800">
{`// Configuración sugerida para Vuetify 3 (plugins/vuetify.ts)
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'misionTheme',
    themes: {
      misionTheme: {
        dark: false,
        colors: {
          primary: '#2563EB',    // Azul Real
          secondary: '#4F46E5',  // Índigo Simulación
          accent: '#F59E0B',     // Ámbar Prioridad Juguete
          success: '#10B981',    // Verde Meta Cumplida
          error: '#EF4444',      // Rojo 0 Regalos
          surface: '#FFFFFF',
          background: '#F8FAFC',
        },
      },
    },
  },
});`}
        </pre>
      </div>
    </div>
  );
};
