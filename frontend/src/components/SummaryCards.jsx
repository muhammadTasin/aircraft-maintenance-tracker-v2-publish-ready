export default function SummaryCards({ summary }) {
  const cards = [
    { label: 'Fleet', value: summary?.totalAircraft ?? 0 },
    { label: 'Grounded', value: summary?.groundedAircraft ?? 0 },
    { label: 'AOG', value: summary?.aog ?? 0 },
    { label: 'Open Tasks', value: summary?.openTasks ?? 0 },
    { label: 'Overdue Tasks', value: summary?.overdueTasks ?? 0 },
    { label: 'Due Soon', value: summary?.dueSoonTasks ?? 0 },
    { label: 'Open Defects', value: summary?.openDefects ?? 0 },
    { label: 'Critical Defects', value: summary?.criticalDefects ?? 0 },
    { label: 'Upcoming Checks', value: summary?.upcomingChecks ?? 0 },
    { label: 'Overdue Checks', value: summary?.overdueChecks ?? 0 },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div className="summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </div>
      ))}
    </div>
  );
}
