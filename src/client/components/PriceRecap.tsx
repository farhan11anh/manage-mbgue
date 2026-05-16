const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface RecapItem {
  menuName: string;
  totalPrice: number;
}

interface Props {
  items: RecapItem[];
}

export default function PriceRecap({ items }: Props) {
  const grandTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-bold text-lg mb-4">💰 Rekap Harga</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted border-b border-white/10">
            <th className="text-left py-2">Menu</th>
            <th className="text-right py-2">Total Harga Bahan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-2">{item.menuName}</td>
              <td className="text-right py-2">{formatRupiah(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary/30">
            <td className="py-3 font-heading font-bold text-lg">GRAND TOTAL</td>
            <td className="text-right py-3 font-heading font-bold text-lg text-primary">{formatRupiah(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
