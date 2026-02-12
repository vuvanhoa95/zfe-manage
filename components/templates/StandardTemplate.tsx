'use client';

import Image from 'next/image';
import { QuotationFormData } from '@/types/quotation';
import { formatVND } from '@/lib/number-to-words-vn';
import InlineEditor from '../quotation/preview/InlineEditor';
import SectionDragDrop from '../quotation/preview/SectionDragDrop';

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

export default function StandardTemplate({
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
    <div id="printArea" className="bg-white p-8">
      {/* Header with Logo */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-48 h-24">
            <Image
              src="/logo.png"
              alt="ZFENIX Logo"
              fill
              className="object-contain"
              priority
              quality={100}
            />
          </div>
          <div className="text-right text-sm italic text-gray-600">
            {data.location}, {dateInfo.full}
          </div>
        </div>
        {onDataChange ? (
          <InlineEditor
            value={data.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM'}
            onChange={async (newValue) => {
              await onDataChange('title', newValue);
            }}
            type="text"
            placeholder="Click to edit title..."
            className="text-center text-2xl font-bold text-theme-primary"
          />
        ) : (
          <h1 className="text-center text-2xl font-bold text-theme-primary">{data.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM'}</h1>
        )}
      </div>

      <SectionDragDrop
        isEditing={!!onDataChange}
        order={data.sectionOrder}
        onOrderChange={async (newOrder) => {
          if (onDataChange) {
            await onDataChange('sectionOrder', newOrder);
          }
        }}
        sections={[
          {
            id: 'intro',
            name: 'Lời mở đầu',
            component: (
              onDataChange ? (
                <InlineEditor
                  value={data.introText || 'Chúng tôi xin trân trọng cảm ơn Quý Công ty đã tin tưởng và mời chúng tôi tham gia chào giá dịch vụ tư vấn tạo lập mô hình BIM.'}
                  onChange={async (newValue) => {
                    await onDataChange('introText', newValue);
                  }}
                  type="textarea"
                  placeholder="Click to edit introduction..."
                  className="mb-6 text-sm"
                />
              ) : (
                <div className="mb-6 text-sm">Chúng tôi xin trân trọng cảm ơn Quý Công ty đã tin tưởng và mời chúng tôi tham gia chào giá dịch vụ tư vấn tạo lập mô hình BIM.</div>
              )
            )
          },
          {
            id: 'project_info',
            name: 'Thông tin dự án',
            component: (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-theme-primary">I. THÔNG TIN DỰ ÁN</h3>
                <div className="ml-4 text-sm">
                  <p>- Dự án: {data.projectName}</p>
                  {data.projectItem && <p>- Hạng mục: {data.projectItem}</p>}
                </div>
              </div>
            )
          },
          {
            id: 'scope',
            name: 'Phạm vi công việc',
            component: (
              data.scopeText ? (
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-theme-primary">II. PHẠM VI CÔNG VIỆC</h3>
                  {onDataChange ? (
                    <InlineEditor
                      value={data.scopeText}
                      onChange={async (newValue) => {
                        await onDataChange('scopeText', newValue);
                      }}
                      type="textarea"
                      placeholder="Click to edit scope..."
                      className="ml-4 text-sm whitespace-pre-line"
                    />
                  ) : (
                    <div className="ml-4 text-sm whitespace-pre-line">{data.scopeText}</div>
                  )}
                </div>
              ) : null
            )
          },
          {
            id: 'deliverables',
            name: 'Sản phẩm bàn giao',
            component: (
              data.deliverablesText ? (
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-theme-primary">III. SẢN PHẨM BÀN GIAO</h3>
                  {onDataChange ? (
                    <InlineEditor
                      value={data.deliverablesText}
                      onChange={async (newValue) => {
                        await onDataChange('deliverablesText', newValue);
                      }}
                      type="textarea"
                      placeholder="Click to edit deliverables..."
                      className="ml-8 text-sm"
                    />
                  ) : (
                    <ul className="ml-8 text-sm list-disc" dangerouslySetInnerHTML={{ __html: data.deliverablesText }}></ul>
                  )}
                </div>
              ) : null
            )
          },
          {
            id: 'pricing_detail',
            name: 'Chi tiết đơn giá',
            component: (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-theme-primary">IV. CHI TIẾT ĐƠN GIÁ</h3>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="py-2 px-2 border">TT</th>
                      <th className="py-2 px-2 border">NỘI DUNG</th>
                      <th className="py-2 px-2 border">KL</th>
                      <th className="py-2 px-2 border">ĐƠN GIÁ</th>
                      <th className="py-2 px-2 border">THÀNH TIỀN</th>
                      <th className="py-2 px-2 border">GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line, index) => {
                      let lineTotal = 0;
                      let qtyLabel = '-';
                      if (line.priceType === 'area') {
                        lineTotal = (data.totalArea || 0) * (line.unitPrice || 0);
                        qtyLabel = `${data.totalArea || 0}`;
                      } else if (line.priceType === 'none') {
                        lineTotal = 0;
                        qtyLabel = '-';
                      } else {
                        lineTotal = (line.qty || 1) * (line.unitPrice || 0);
                        qtyLabel = `${line.qty || 1}`;
                      }
                      if (line.isGroupHeader) {
                        return (
                          <tr key={index} className="font-bold bg-gray-100">
                            <td className="py-2 px-2 border text-sm">{line.itemNo}</td>
                            <td className="py-2 px-2 border text-sm" colSpan={5}>{line.title}</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={index}>
                          <td className="py-2 px-2 border text-xs">{line.itemNo}</td>
                          <td className="py-2 px-2 border text-xs">{line.title}</td>
                          <td className="py-2 px-2 border text-xs text-center">{line.priceType === 'none' ? '-' : qtyLabel}</td>
                          <td className="py-2 px-2 border text-xs text-right">{line.priceType === 'none' ? '-' : formatVND(line.unitPrice || 0)}</td>
                          <td className="py-2 px-2 border text-xs text-right">{line.priceType === 'none' ? '-' : formatVND(lineTotal)}</td>
                          <td className="py-2 px-2 border text-xs">{line.note || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          },
          {
            id: 'pricing_summary',
            name: 'Tổng cộng báo giá',
            component: (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-theme-primary">B. BÁO GIÁ</h3>
                <table className="w-full text-sm border">
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border font-bold">TỔNG CỘNG (CHƯA VAT)</td>
                      <td className="py-2 px-3 border text-right font-bold">{formatVND(totalBeforeVat)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">VAT ({(data.vatRate * 100).toFixed(0)}%)</td>
                      <td className="py-2 px-3 border text-right">{formatVND(vatAmount)}</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="py-2 px-3 border font-bold">TỔNG CỘNG (ĐÃ VAT)</td>
                      <td className="py-2 px-3 border text-right font-bold">{formatVND(totalAfterVat)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          },
          {
            id: 'schedule',
            name: 'Tiến độ thực hiện',
            component: (
              data.scheduleText ? (
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-theme-primary">VI. TIẾN ĐỘ THỰC HIỆN</h3>
                  <div className="ml-4 text-sm">{data.scheduleText}</div>
                </div>
              ) : null
            )
          },
          {
            id: 'payment',
            name: 'Tiến độ thanh toán',
            component: (
              data.paymentMilestones && data.paymentMilestones.length > 0 ? (
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-theme-primary">VII. TIẾN ĐỘ THANH TOÁN</h3>
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="py-2 px-3 border">STT</th>
                        <th className="py-2 px-3 border">Nội dung</th>
                        <th className="py-2 px-3 border">Tỉ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paymentMilestones
                        .sort((a, b) => a.order - b.order)
                        .map((milestone) => (
                          <tr key={milestone.no}>
                            <td className="py-2 px-3 border text-center">{milestone.no}</td>
                            <td className="py-2 px-3 border">{milestone.title}</td>
                            <td className="py-2 px-3 border text-right">{milestone.percent}%</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null
            )
          },
          {
            id: 'media',
            name: 'Hình ảnh & Video dự án',
            component: (
              data.media && data.media.length > 0 ? (
                <div className="mb-6">
                  <h3 className="font-bold mb-4 text-theme-primary uppercase tracking-wide border-b pb-1">📸 HÌNH ẢNH & VIDEO DỰ ÁN MINH HỌA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.media.map((item) => (
                      <div key={item.id} className="space-y-2">
                        {item.type === 'image' ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                            <img src={item.url} alt={item.title || 'Project Image'} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-black">
                            <iframe
                              src={item.url}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={item.title || 'Project Video'}
                            />
                          </div>
                        )}
                        {item.title && <p className="text-xs font-bold text-gray-700 italic text-center">{item.title}</p>}
                        {item.caption && <p className="text-[10px] text-gray-500 text-center">{item.caption}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )
          }
        ]}
      />

      <div className="mt-12 mb-6">
        {onDataChange ? (
          <InlineEditor
            value={data.introText || 'Thay mặt đơn vị triển khai xin trân trọng cảm ơn và mong muốn có cơ hội hợp tác với Quý Công ty.'}
            onChange={async (newValue) => {
              await onDataChange('introText', newValue);
            }}
            type="textarea"
            placeholder="Click to edit outro text..."
            className="text-center text-sm italic mb-8"
          />
        ) : (
          <div className="text-center text-sm italic mb-8">
            {data.introText || 'Thay mặt đơn vị triển khai xin trân trọng cảm ơn và mong muốn có cơ hội hợp tác với Quý Công ty.'}
          </div>
        )}
        {company && (
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-2 text-theme-primary">ĐƠN VỊ TRIỂN KHAI</h4>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{company.name}</p>
                  <p>Địa chỉ: {company.address}</p>
                  <p>Mã số thuế: {company.taxCode}</p>
                  {company.email && <p>Email: {company.email}</p>}
                  {company.website && <p>Website: {company.website}</p>}
                  {company.phone && <p>Điện thoại: {company.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm space-y-8">
                  <div>
                    <p className="font-semibold mb-2">Người đại diện</p>
                    <div className="mt-16">
                      <p className="font-bold">{company.signerName}</p>
                      <p className="text-xs italic">{company.signerTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
