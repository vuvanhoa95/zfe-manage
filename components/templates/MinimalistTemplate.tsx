'use client';

import Image from 'next/image';
import { QuotationFormData } from '@/types/quotation';
import { formatVND } from '@/lib/number-to-words-vn';
import InlineEditor from '../quotation/preview/InlineEditor';

interface TemplateProps {
  data: QuotationFormData;
  company: any;
  customer: any;
  dateInfo: any;
  totalBeforeVat: number;
  vatAmount: number;
  totalAfterVat: number;
  totalInWords: string;
  onDataChange?: (field: keyof QuotationFormData, value: any) => Promise<void>;
}

export default function MinimalistTemplate({
  data,
  company,
  customer,
  dateInfo,
  totalBeforeVat,
  vatAmount,
  totalAfterVat,
  totalInWords,
  onDataChange,
}: TemplateProps) {
  return (
    <div id="printArea" className="bg-white p-12 max-w-4xl mx-auto shadow-sm">
      {/* Minimal Header */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <div className="relative w-32 h-12 mb-4">
            <Image
              src="/logo.png"
              alt="ZFENIX Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
            {company?.address}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-light tracking-tight text-theme-primary mb-1 italic">
             {onDataChange ? (
                <InlineEditor
                  value={data.title || 'QUOTATION'}
                  onChange={async (newValue) => {
                    await onDataChange('title', newValue);
                  }}
                  type="text"
                  placeholder="Click to edit title..."
                />
              ) : (
                data.title || 'QUOTATION'
              )}
          </h1>
          <p className="text-xs text-gray-400">{dateInfo.full}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-12">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Attention To</p>
        <p className="text-lg font-bold text-gray-800">{customer?.name || 'Quý Khách Hàng'}</p>
        <p className="text-sm text-gray-600">{customer?.address}</p>
      </div>

      {/* Introduction */}
      <div className="mb-12 italic text-gray-600 border-l-2 border-theme-primary pl-4">
        {onDataChange ? (
          <InlineEditor
            value={data.introText || 'Chúng tôi gửi tới Quý khách hàng báo giá chi tiết cho dự án:'}
            onChange={async (newValue) => {
              await onDataChange('introText', newValue);
            }}
            type="textarea"
            className="text-sm"
          />
        ) : (
          <p className="text-sm">{data.introText}</p>
        )}
        <p className="mt-2 text-sm font-bold text-gray-800 tracking-wide uppercase">{data.projectName}</p>
      </div>

      {/* Simplified Pricing Table */}
      <div className="mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 text-gray-400 text-left">
              <th className="py-4 font-medium">Description</th>
              <th className="py-4 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.lines.filter(l => !l.isGroupHeader).map((line, index) => {
              let lineTotal = 0;
              if (line.priceType === 'area') {
                lineTotal = (data.totalArea || 0) * (line.unitPrice || 0);
              } else if (line.priceType !== 'none') {
                lineTotal = (line.qty || 1) * (line.unitPrice || 0);
              }

              return (
                <tr key={index}>
                  <td className="py-4">
                    <p className="font-bold text-gray-800">{line.title}</p>
                    {line.note && <p className="text-xs text-gray-400 mt-1">{line.note}</p>}
                  </td>
                  <td className="py-4 text-right font-medium">
                    {line.priceType === 'none' ? '—' : formatVND(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-100">
              <td className="py-4 text-gray-400">Subtotal</td>
              <td className="py-4 text-right">{formatVND(totalBeforeVat)}</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-400">VAT ({(data.vatRate * 100).toFixed(0)}%)</td>
              <td className="py-2 text-right">{formatVND(vatAmount)}</td>
            </tr>
            <tr className="text-lg font-bold text-theme-primary">
              <td className="py-6">Total Amount</td>
              <td className="py-6 text-right">{formatVND(totalAfterVat)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer / Signature */}
      <div className="mt-24 pt-12 border-t border-gray-50 flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-4">Authorized Signature</p>
          <div className="h-16"></div>
          <p className="font-bold text-gray-800">{company?.signerName}</p>
          <p className="text-xs text-gray-500">{company?.signerTitle}</p>
        </div>
        <div className="text-right text-[10px] text-gray-300">
          ZFENIX QUOTATION SYSTEM • {data.location}
        </div>
      </div>
    </div>
  );
}
