import { NextRequest, NextResponse } from 'next/server';
import { parseArcisPdfBuffer } from '@/lib/arcis-parser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projetoId = (formData.get('projetoId') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'O arquivo precisa ser um documento PDF do relatório RSC da ARCIS.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const parsedData = await parseArcisPdfBuffer(uint8Array, projetoId);

    return NextResponse.json({
      success: true,
      data: parsedData,
      filename: file.name,
      sizeBytes: file.size,
    });
  } catch (error: unknown) {
    console.error('Erro ao processar PDF da ARCIS:', error);
    const msg = error instanceof Error ? error.message : 'Falha desconhecida na extração do PDF';
    return NextResponse.json(
      { error: `Erro na leitura do relatório PDF: ${msg}` },
      { status: 500 }
    );
  }
}
