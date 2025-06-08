import moment from 'moment';

import { PaymentBaseProps, PaymentStatusType } from '@/domains/payment';

interface PaymentDetailProps {
  payments: PaymentBaseProps[];
}

export const PaymentDetail = ({ payments }: PaymentDetailProps) => {
  const getStatusBadge = (status: PaymentStatusType) => {
    const statusConfig = {
      [PaymentStatusType.Wait]: { className: 'bg-yellow-100 text-yellow-700', label: '處理中' },
      [PaymentStatusType.Success]: { className: 'bg-green-100 text-green-700', label: '已完成' },
      [PaymentStatusType.Fail]: { className: 'bg-red-100 text-red-700', label: '失敗' },
    };

    const config = statusConfig[status] ?? { className: 'bg-red-100 text-red-700', label: '未完成' };
    return (
      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${config.className}`}>{config.label}</span>
    );
  };

  return (
    <div className="bg-backgroundLight rounded-lg shadow-md p-6 max-h-[600px] overflow-y-scroll">
      <h2 className="text-2xl font-semibold mb-8">付款紀錄 ({payments.length})</h2>

      {!payments.length && (
        <div className="text-center">
          <label>目前沒有付款紀錄</label>
        </div>
      )}
      {!!payments.length && (
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-foreground/10">
              <thead>
                <tr>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">金額</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">訊息</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">狀態</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {!!payments.length &&
                  payments.map((payment) => (
                    <tr key={payment._id.toString()} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium">${payment.amount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90 max-w-[250px] overflow-x-auto">
                        {payment.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90">
                        {moment(payment.createdAt).format('YYYY年MM月DD日 HH:mm')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
