import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { ScenarioResult, SimulationResult } from '../engine/types';
import { fmtNIS, fmtPercent, fmtPoints } from '../engine/format';
import { rubikBold, rubikRegular } from './fonts';

// Rubik couvre le latin ET l'hébreu (ביטוח לאומי, נקודות זיכוי…).
Font.register({
  family: 'Rubik',
  fonts: [
    { src: rubikRegular, fontWeight: 400 },
    { src: rubikBold, fontWeight: 700 },
  ],
});
// Évite la césure automatique (mauvaise avec l'hébreu et les montants).
Font.registerHyphenationCallback((word) => [word]);

const NAVY = '#1A2138';
const GOLD = '#C9A24B';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Rubik',
    fontSize: 9,
    color: '#1f2937',
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    padding: 14,
    marginBottom: 4,
  },
  monogram: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  monogramText: { color: GOLD, fontSize: 15, fontWeight: 700 },
  headerTitle: { color: '#ffffff', fontSize: 14, fontWeight: 700 },
  headerSub: { color: '#cbd5e1', fontSize: 8.5, marginTop: 2 },
  goldBar: { height: 3, backgroundColor: GOLD, marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaText: { fontSize: 9, color: '#475569' },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  rowIndent: { paddingLeft: 12 },
  rowLabel: { flex: 1, paddingRight: 8 },
  rowValue: { textAlign: 'right' },
  strong: { fontWeight: 700, color: NAVY },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 3,
    paddingTop: 4,
  },
  comparTable: { flexDirection: 'row', marginTop: 4, gap: 14 },
  comparCol: { flex: 1 },
  comparHead: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  recoBox: {
    borderWidth: 1,
    borderColor: GOLD,
    borderLeftWidth: 4,
    padding: 10,
    marginTop: 6,
    backgroundColor: '#fdfaf2',
  },
  savingBanner: {
    backgroundColor: NAVY,
    color: '#ffffff',
    textAlign: 'center',
    padding: 8,
    marginTop: 10,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: GOLD,
    paddingTop: 6,
    fontSize: 7.5,
    color: '#64748b',
    textAlign: 'center',
  },
});

function Row({
  label,
  value,
  strong,
  indent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  indent?: boolean;
}) {
  return (
    <View style={[styles.row, ...(indent ? [styles.rowIndent] : [])]}>
      <Text style={[styles.rowLabel, ...(strong ? [styles.strong] : [])]}>{label}</Text>
      <Text style={[styles.rowValue, ...(strong ? [styles.strong] : [])]}>{value}</Text>
    </View>
  );
}

function ScenarioCol({ s, title }: { s: ScenarioResult; title: string }) {
  return (
    <View style={styles.comparCol}>
      <Text style={[styles.comparHead, { color: NAVY }]}>{title}</Text>
      <Row label="Dépôt pension" value={fmtNIS(s.pensionDeposit)} />
      <Row label="Dépôt keren hishtalmout" value={fmtNIS(s.kerenDeposit)} />
      <Row label="Revenu imposable" value={fmtNIS(s.taxableIncome)} />
      <Row label="Impôt net" value={fmtNIS(s.netTax)} />
      <Row label="ביטוח לאומי" value={fmtNIS(s.bituachLeumi.total)} />
      <View style={styles.totalRow}>
        <Text style={[styles.rowLabel, styles.strong]}>Net disponible</Text>
        <Text style={[styles.rowValue, styles.strong]}>{fmtNIS(s.netDisposable)}</Text>
      </View>
    </View>
  );
}

export default function ClientReport({ result }: { result: SimulationResult }) {
  const b = result.baseline;
  const o = result.optimized;
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <Document
      title={`Simulation fiscale ${result.year} — ${result.input.clientName || 'Client'}`}
      author="Krief Expertise, Jérusalem"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header} fixed>
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>KE</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Krief Expertise · Jérusalem</Text>
            <Text style={styles.headerSub}>
              Simulation fiscale indépendant (עצמאי) — année fiscale {result.year}
            </Text>
          </View>
        </View>
        <View style={styles.goldBar} fixed />

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Client : {result.input.clientName || '—'}
          </Text>
          <Text style={styles.metaText}>Date : {today}</Text>
        </View>

        {/* Hypothèses */}
        <Text style={styles.sectionTitle}>Hypothèses retenues</Text>
        <Row label="Chiffre d’affaires annuel estimé" value={fmtNIS(result.input.revenue)} />
        <Row label="Bénéfice net annuel estimé" value={fmtNIS(result.input.netProfit)} />
        <Row label="Cotisation pension prévue" value={fmtNIS(result.input.pensionDeposit)} />
        <Row label="Cotisation keren hishtalmout prévue" value={fmtNIS(result.input.kerenDeposit)} />
        <Row
          label="Assurance perte d’exploitation (אובדן כושר עבודה)"
          value={result.input.hasDisabilityInsurance ? 'Oui' : 'Non'}
        />

        {/* Impôt */}
        <Text style={styles.sectionTitle}>Impôt sur le revenu {result.year}</Text>
        <Row label="Revenu imposable" value={fmtNIS(b.taxableIncome)} />
        <Row label="Impôt brut au barème (incl. מס יסף)" value={fmtNIS(b.grossTax)} />
        <Row
          label={`נקודות זיכוי — ${fmtPoints(b.totalPoints)} points`}
          value={`− ${fmtNIS(b.pointsCredit)}`}
        />
        {b.creditPointLines.map((l, i) => (
          <Row key={i} indent label={l.label} value={`${fmtPoints(l.points)} pts`} />
        ))}
        <Row label="Zikouy pension (35 %)" value={`− ${fmtNIS(b.pensionZikuy)}`} />
        <View style={styles.totalRow}>
          <Text style={[styles.rowLabel, styles.strong]}>Impôt net annuel</Text>
          <Text style={[styles.rowValue, styles.strong]}>{fmtNIS(b.netTax)}</Text>
        </View>
        <Row
          label="Taux de מקדמות IR — à reporter sur le דוח מקדמות"
          value={fmtPercent(b.mikdamotRate)}
          strong
        />

        {/* BL */}
        <Text style={styles.sectionTitle}>ביטוח לאומי (עצמאי)</Text>
        <Row label="Assiette annuelle" value={fmtNIS(b.bituachLeumi.base)} />
        <Row indent label="דמי ביטוח לאומי" value={fmtNIS(b.bituachLeumi.leumi)} />
        <Row indent label="דמי ביטוח בריאות" value={fmtNIS(b.bituachLeumi.health)} />
        <Row label="Total annuel" value={fmtNIS(b.bituachLeumi.total)} strong />
        <Row label="מקדמה mensuelle" value={fmtNIS(b.bituachLeumi.monthlyAdvance)} strong />

        {/* Recommandations */}
        <Text style={styles.sectionTitle}>Recommandations</Text>
        <View style={styles.recoBox}>
          <Row
            label="Pension — minimum légal (פנסיית חובה)"
            value={fmtNIS(result.pensionReco.mandatoryMinimum)}
          />
          <Row
            label="Pension — dépôt optimisé fiscalement"
            value={fmtNIS(result.pensionReco.optimizedDeposit)}
          />
          <Row
            label="Gain annuel estimé (pension)"
            value={fmtNIS(result.pensionReco.taxSavingVsCurrent)}
            strong
          />
          <Row
            label="Keren hishtalmout — dépôt optimal déductible"
            value={fmtNIS(result.kerenReco.optimalDeductibleDeposit)}
          />
          <Row
            label="Gain annuel estimé (keren)"
            value={fmtNIS(result.kerenReco.taxSavingVsCurrent)}
            strong
          />
          <Row
            label="Plafond exonéré de מס רווחי הון (תקרה מוטבת)"
            value={fmtNIS(result.kerenReco.exemptDepositCeiling)}
          />
        </View>

        {/* Comparatif */}
        <Text style={styles.sectionTitle} break>
          Comparatif sans / avec optimisation
        </Text>
        <View style={styles.comparTable}>
          <ScenarioCol s={b} title="Sans optimisation" />
          <ScenarioCol s={o} title="Avec optimisation" />
        </View>
        <Text style={styles.savingBanner}>
          Économie totale estimée (IR + ביטוח לאומי) :{' '}
          {fmtNIS(b.netTax + b.bituachLeumi.total - o.netTax - o.bituachLeumi.total)} / an
        </Text>

        {/* Pied de page */}
        <Text style={styles.footer} fixed>
          Simulation indicative établie sur la base des paramètres fiscaux {result.year} — ne
          constitue pas une déclaration fiscale. Krief Expertise, Jérusalem.
        </Text>
      </Page>
    </Document>
  );
}
