'use client'

import React, { } from 'react'
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface InvoiceProps {
    clientName: string
    date: Date
    items: {
        name: string
        quantity: number
        unitPrice: number
        amount: number
    }[]
    totalAmount: number
    companyInfo?: {
        name: string
        owner: string
        registrationNumber: string
        address: string
        contact: string
    }
}

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ clientName, date, items, totalAmount, companyInfo }, ref) => {
    const defaultCompanyInfo = {
        name: "필몽 (PHILMONG)",
        owner: "김필몽",
        registrationNumber: "123-45-67890", // Update with real info later
        address: "경기도 시흥시 ...",
        contact: "010-0000-0000"
    }

    const company = companyInfo || defaultCompanyInfo

    return (
        <div ref={ref} className="p-8 bg-white text-black print:block hidden" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold tracking-widest mb-2">거 래 명 세 표</h1>
                <p className="text-sm">Transaction Statement</p>
            </div>

            {/* Top Section: Date & Client vs Provider */}
            <div className="flex justify-between mb-8">
                <div className="w-1/2 pr-4">
                    <table className="w-full border-collapse border border-black text-sm">
                        <tbody>
                            <tr>
                                <th className="border border-black bg-gray-100 p-2 w-24">일자</th>
                                <td className="border border-black p-2">{format(date, "yyyy년 MM월 dd일", { locale: ko })}</td>
                            </tr>
                            <tr>
                                <th className="border border-black bg-gray-100 p-2">받는분</th>
                                <td className="border border-black p-2 font-bold text-lg">{clientName} 귀하</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="w-1/2 pl-4">
                    <table className="w-full border-collapse border border-black text-sm">
                        <tbody>
                            <tr>
                                <th rowSpan={4} className="border border-black bg-gray-100 p-2 w-8 text-center vertical-rl">공<br />급<br />자</th>
                                <th className="border border-black p-1 w-20 bg-gray-50">등록번호</th>
                                <td colSpan={3} className="border border-black p-1">{company.registrationNumber}</td>
                            </tr>
                            <tr>
                                <th className="border border-black p-1 bg-gray-50">상호</th>
                                <td className="border border-black p-1">{company.name}</td>
                                <th className="border border-black p-1 bg-gray-50">성명</th>
                                <td className="border border-black p-1">{company.owner} (인)</td>
                            </tr>
                            <tr>
                                <th className="border border-black p-1 bg-gray-50">주소</th>
                                <td colSpan={3} className="border border-black p-1 text-xs">{company.address}</td>
                            </tr>
                            <tr>
                                <th className="border border-black p-1 bg-gray-50">연락처</th>
                                <td colSpan={3} className="border border-black p-1">{company.contact}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-black mb-8 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-12">No</th>
                        <th className="border border-black p-2">품목</th>
                        <th className="border border-black p-2 w-16">규격</th>
                        <th className="border border-black p-2 w-16">수량</th>
                        <th className="border border-black p-2 w-24">단가</th>
                        <th className="border border-black p-2 w-28">공급가액</th>
                        <th className="border border-black p-2 w-24">세액</th>
                        <th className="border border-black p-2 w-32">비고</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="border border-black p-2 text-center">{index + 1}</td>
                            <td className="border border-black p-2">{item.name}</td>
                            <td className="border border-black p-2 text-center">-</td>
                            <td className="border border-black p-2 text-center">{item.quantity.toLocaleString()}</td>
                            <td className="border border-black p-2 text-right">{item.unitPrice.toLocaleString()}</td>
                            <td className="border border-black p-2 text-right">{item.amount.toLocaleString()}</td>
                            <td className="border border-black p-2 text-center">0</td>
                            {/* Assuming tax included or 0 for simplification as requested? usually food is tax free in some cases or included. 
                                Let's assume 'included' or 'none' for simplicty unless specified. 
                                User said "거래명세표". usually supplies amount + tax. 
                                Let's keep it simple for now: amount is total. Tax 0 or separate?
                                Let's put 0 for tax col and amount as total.
                            */}
                            <td className="border border-black p-2"></td>
                        </tr>
                    ))}
                    {/* Fill empty rows to make it look formal */}
                    {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                            <td className="border border-black p-2 text-center">&nbsp;</td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={5} className="border border-black p-2 text-center">합 계 (Total)</td>
                        <td colSpan={3} className="border border-black p-2 text-right text-lg">
                            ₩ {totalAmount.toLocaleString()}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8">
                <p>위와 같이 정히 영수(청구)함.</p>
            </div>
        </div>
    )
})

Invoice.displayName = "Invoice"
