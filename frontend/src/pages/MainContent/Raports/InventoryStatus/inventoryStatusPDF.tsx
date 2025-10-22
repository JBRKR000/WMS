import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Item } from '../../../../types'

// Helper to convert Polish characters for PDF compatibility
const toASCII = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'A')
    .replace(/Ć/g, 'C')
    .replace(/Ę/g, 'E')
    .replace(/Ł/g, 'L')
    .replace(/Ń/g, 'N')
    .replace(/Ó/g, 'O')
    .replace(/Ś/g, 'S')
    .replace(/Ź/g, 'Z')
    .replace(/Ż/g, 'Z')
}

const unitDisplay: Record<string, string> = {
  PCS: 'szt.',
  KG: 'kg',
  LITER: 'l',
  METER: 'm',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Times-Roman',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1a365d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    border: '1px solid #ddd',
    padding: 10,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
})

interface InventoryStatusPDFProps {
  items: Item[]
  categories: Array<{ name: string; qty: number; count: number }>
  criticalCount: number
  totalQuantity: number
  averageQuantity: number
}

export const InventoryStatusPDF = ({ items, categories, criticalCount, totalQuantity, averageQuantity }: InventoryStatusPDFProps) => {
  // Split items into chunks of 15 per page
  const itemsPerPage = 15
  const itemPages = Array.from({ length: Math.ceil(items.length / itemsPerPage) }, (_, i) =>
    items.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
  )

  return (
    <Document>
      {/* First page with stats and categories */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Szybki Raport Magazynu</Text>
          <Text style={styles.subtitle}>Wygenerowano: {new Date().toLocaleString('pl-PL')}</Text>
        </View>

        {/* KPI Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statystyki</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Liczba pozycji</Text>
              <Text style={styles.statValue}>{items.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Calkowita ilosc</Text>
              <Text style={styles.statValue}>{totalQuantity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Srednia per pozycja</Text>
              <Text style={styles.statValue}>{averageQuantity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Stan krytyczny</Text>
              <Text style={{ ...styles.statValue, color: criticalCount > 0 ? '#dc2626' : '#16a34a' }}>
                {criticalCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Categories Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rozklad po kategoriach</Text>
          <View style={styles.table}>
            <View style={{ display: 'flex', flexDirection: 'row', ...styles.tableHeader }}>
              <Text style={{ ...styles.tableCell, flex: 2, fontWeight: 'bold' }}>Kategoria</Text>
              <Text style={{ ...styles.tableCell, flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Ilosc</Text>
              <Text style={{ ...styles.tableCell, flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Pozycji</Text>
            </View>
            {categories.map((cat, idx) => (
              <View key={idx} style={{ display: 'flex', flexDirection: 'row' }}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{toASCII(cat.name)}</Text>
                <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>{cat.qty}</Text>
                <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>{cat.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Item pages */}
      {itemPages.map((pageItems, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Lista pozycji - Strona {pageIdx + 1}</Text>
            <Text style={styles.subtitle}>Wygenerowano: {new Date().toLocaleString('pl-PL')}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.table}>
              <View style={{ display: 'flex', flexDirection: 'row', ...styles.tableHeader }}>
                <Text style={{ ...styles.tableCell, flex: 2.5, fontWeight: 'bold' }}>Nazwa</Text>
                <Text style={{ ...styles.tableCell, flex: 2, fontWeight: 'bold' }}>Kategoria</Text>
                <Text style={{ ...styles.tableCell, flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Stan</Text>
              </View>
              {pageItems.map((item, idx) => (
                <View key={idx} style={{ display: 'flex', flexDirection: 'row' }}>
                  <Text style={{ ...styles.tableCell, flex: 2.5 }}>{toASCII(item.name)}</Text>
                  <Text style={{ ...styles.tableCell, flex: 2 }}>{toASCII(item.categoryName ?? 'Bez kat.')}</Text>
                  <Text style={{ ...styles.tableCell, flex: 1, textAlign: 'center' }}>
                    {item.currentQuantity} {unitDisplay[item.unit]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text>WMS - Warehouse Management System | Strona {pageIdx + 1} z {itemPages.length}</Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}

export default InventoryStatusPDF