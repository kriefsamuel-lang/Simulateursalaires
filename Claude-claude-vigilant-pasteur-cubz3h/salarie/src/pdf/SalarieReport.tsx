import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { SalarieResult, SalarieInput } from '../engine/types';
import { formatCurrency, formatPercent } from '../engine/format';

Font.register({
  family: 'Rubik',
  src: 'https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-4I-1UA.woff2',
});

const navy = '#1A2138';
const gold = '#C9A24B';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Rubik',
    fontSize: 9,
    padding: 30,
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: gold,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: gold,
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: navy },
  headerSub: { fontSize: 9, color: gold, marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: navy,
    borderBottomWidth: 1,
    borderBottomColor: gold,
    paddingBottom: 2,
    marginBottom: 5,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  rowLabel: { color: '#555', flex: 1 },
  rowValue: { color: '#222', fontWeight: 'bold', textAlign: 'right' },
  rowIndent: { paddingLeft: 10 },
  synthese: {
    backgroundColor: navy,
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  syntheseTitle: { color: gold, fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  syntheseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  syntheseLabel: { color: '#ccc', fontSize: 9 },
  syntheseValue: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  syntheseTotal: { color: gold, fontSize: 12, fontWeight: 'bold' },
  disclaimer: {
    marginTop: 16,
    fontSize: 7,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  highlight: { backgroundColor: '#FFF8E7', padding: 3, borderRadius: 2 },
  meta: { fontSize: 8, color: '#888', marginBottom: 12 },
  bold: { fontWeight: 'bold' },
});

interface Props {
  result: SalarieResult;
  input: SalarieInput;
}

export default function SalarieReport({ result, input }: Props) {
  const { brut, net, bl, ir, pension, keren, indirect, creditPointLines } = result;
  const generatedDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>KE</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Cabinet Krief Expertise</Text>
            <Text style={styles.headerSub}>Simulateur de Charges Salariales · Jerusalem</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text>Genere le {generatedDate}{input.clientName ? ` · Client: ${input.clientName}` : ''}</Text>
          <Text>Annee fiscale: {input.fiscalYear} · Mode: {input.mode === 'brut' ? 'Saisie brut' : 'Saisie net'} · Taux emploi: {Math.round(input.employmentRate * 100)}%</Text>
          <Text>Pension: Employe {(input.pension.employeeTagmoulimRate * 100).toFixed(1)}% / Employeur tagmoulim {(input.pension.employerTagmoulimRate * 100).toFixed(1)}% + pitsouim {(input.pension.employerPitsouimRate * 100).toFixed(1)}%{input.keren.enabled ? ` · Keren: Employe ${(input.keren.employeeRate * 100).toFixed(1)}% / Employeur ${(input.keren.employerRate * 100).toFixed(1)}%` : ''}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cote employe</Text>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.bold]}>Salaire brut</Text><Text style={styles.rowValue}>{formatCurrency(brut)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>BL Leumi</Text><Text style={styles.rowValue}>- {formatCurrency(bl.employeeLeumi)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Maladie Briut</Text><Text style={styles.rowValue}>- {formatCurrency(bl.employeeHealth)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.bold]}>Total BL employe</Text><Text style={styles.rowValue}>- {formatCurrency(bl.employeeTotal)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>IR tranches</Text><Text style={styles.rowValue}>{formatCurrency(ir.bracketTax)}</Text></View>
          {ir.surtax > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Mas Yasaf</Text><Text style={styles.rowValue}>{formatCurrency(ir.surtax)}</Text></View>}
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Points de credit ({ir.creditPoints.toFixed(2)})</Text><Text style={styles.rowValue}>- {formatCurrency(ir.creditPointsValue)}</Text></View>
          {ir.pensionCredit > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Zikuy pension</Text><Text style={styles.rowValue}>- {formatCurrency(ir.pensionCredit)}</Text></View>}
          <View style={styles.row}><Text style={[styles.rowLabel, styles.bold]}>IR net</Text><Text style={styles.rowValue}>- {formatCurrency(ir.netTax)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Tagmoulim employe</Text><Text style={styles.rowValue}>- {formatCurrency(pension.employeeContrib)}</Text></View>
          {keren.employeeContrib > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Keren employe</Text><Text style={styles.rowValue}>- {formatCurrency(keren.employeeContrib)}</Text></View>}
          <View style={[styles.row, styles.highlight]}><Text style={[styles.rowLabel, styles.bold]}>NET A PAYER</Text><Text style={[styles.rowValue, { color: navy, fontSize: 11 }]}>{formatCurrency(net)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges employeur directes</Text>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>BL employeur</Text><Text style={styles.rowValue}>{formatCurrency(bl.employerBL)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Tagmoulim employeur</Text><Text style={styles.rowValue}>{formatCurrency(pension.employerTagmoulim)}</Text></View>
          <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Pitsouim</Text><Text style={styles.rowValue}>{formatCurrency(pension.employerPitsouim)}</Text></View>
          {keren.employerContrib > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Keren employeur</Text><Text style={styles.rowValue}>{formatCurrency(keren.employerContrib)}</Text></View>}
          <View style={styles.row}><Text style={[styles.rowLabel, styles.bold]}>Cout direct employeur</Text><Text style={styles.rowValue}>{formatCurrency(result.totalEmployerDirectCosts)}</Text></View>
        </View>

        {indirect.totalMonthly > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charges indirectes (provisions)</Text>
            {indirect.havaraMonthly > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Havara (mensuel)</Text><Text style={styles.rowValue}>{formatCurrency(indirect.havaraMonthly)}</Text></View>}
            {indirect.holidaysMonthly > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Conges annuels</Text><Text style={styles.rowValue}>{formatCurrency(indirect.holidaysMonthly)}</Text></View>}
            {indirect.publicHolidaysMonthly > 0 && <View style={styles.row}><Text style={[styles.rowLabel, styles.rowIndent]}>Jours feries</Text><Text style={styles.rowValue}>{formatCurrency(indirect.publicHolidaysMonthly)}</Text></View>}
            <View style={styles.row}><Text style={[styles.rowLabel, styles.bold]}>Total indirectes</Text><Text style={styles.rowValue}>{formatCurrency(indirect.totalMonthly)}</Text></View>
          </View>
        )}

        <View style={styles.synthese}>
          <Text style={styles.syntheseTitle}>Synthese — Cout employeur total</Text>
          <View style={styles.syntheseRow}><Text style={styles.syntheseLabel}>Salaire brut</Text><Text style={styles.syntheseValue}>{formatCurrency(brut)}</Text></View>
          <View style={styles.syntheseRow}><Text style={styles.syntheseLabel}>Net a payer</Text><Text style={styles.syntheseValue}>{formatCurrency(net)}</Text></View>
          <View style={styles.syntheseRow}><Text style={styles.syntheseLabel}>Ratio net / cout</Text><Text style={styles.syntheseValue}>{formatPercent(result.netToCostRatio)}</Text></View>
          <View style={[styles.syntheseRow, { marginTop: 6 }]}>
            <Text style={styles.syntheseTotal}>Cout total employeur</Text>
            <Text style={styles.syntheseTotal}>{formatCurrency(result.totalEmployerCost)}</Text>
          </View>
        </View>

        {creditPointLines.length > 0 && (
          <View style={[styles.section, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { fontSize: 8 }]}>Detail points de credit</Text>
            {creditPointLines.map((l, i) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.rowLabel, { fontSize: 8 }]}>{l.label}</Text>
                <Text style={[styles.rowValue, { fontSize: 8 }]}>{l.points.toFixed(2)} pts</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={[styles.rowLabel, styles.bold, { fontSize: 8 }]}>Total</Text>
              <Text style={[styles.rowValue, { fontSize: 8 }]}>{creditPointLines.reduce((s, l) => s + l.points, 0).toFixed(2)} pts</Text>
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Simulation indicative etablie sur la base des parametres {input.fiscalYear} — ne constitue pas un bulletin de paie. Les charges indirectes sont des provisions estimatives. Krief Expertise, Jerusalem.
        </Text>
      </Page>
    </Document>
  );
}
