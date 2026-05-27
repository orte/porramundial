import { getGroupsForAdmin } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { GroupEditor } from '@/components/admin/GroupEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Grupos · Admin' };

export default async function AdminGruposPage() {
  const groups = await getGroupsForAdmin();

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl">
      <PageHeader
        title="Posiciones de grupo"
        description="Asigna el puesto final de cada equipo. 1º da +1 punto y 2º da +0,5. Los puestos 3º y 4º marcan al equipo como eliminado. Al guardar se recalculan los puntos."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {groups.map((g) => (
          <GroupEditor key={g.groupCode} group={g} />
        ))}
      </div>
    </div>
  );
}
