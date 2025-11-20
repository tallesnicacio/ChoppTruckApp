#!/usr/bin/env python3
"""
Script para gerar ícones do Chopp Truck App
Requer: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Cria um ícone quadrado com emoji de cerveja"""
    # Cria imagem com fundo laranja
    img = Image.new('RGB', (size, size), color='#FFA500')
    draw = ImageDraw.Draw(img)

    # Adiciona círculo branco no centro
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill='white')

    # Tenta adicionar texto (emoji)
    try:
        # Usa fonte grande para o emoji
        font_size = size // 2

        # Texto simples (será um círculo com "CT")
        draw.text((size//2, size//2), "🍺", fill='#FFA500',
                 anchor="mm", font_size=font_size)
    except:
        # Fallback: desenha "CT" (Chopp Truck)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 3)
        except:
            font = ImageFont.load_default()

        draw.text((size//2, size//2), "CT", fill='#FFA500',
                 anchor="mm", font=font)

    # Salva o arquivo
    img.save(filename, 'PNG')
    print(f"✓ Ícone criado: {filename} ({size}x{size})")

if __name__ == '__main__':
    print("Gerando ícones do Chopp Truck App...")

    # Gera ícones de diferentes tamanhos
    create_icon(192, 'icon-192.png')
    create_icon(512, 'icon-512.png')

    print("\n✅ Ícones gerados com sucesso!")
    print("Você pode substituir esses arquivos por ícones personalizados mais tarde.")
