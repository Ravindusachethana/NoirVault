import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BrandPillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-about-us',
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css'
})
export class AboutUs {
  readonly activePillar = signal<string>('craft');

  pillars: BrandPillar[] = [
    {
      id: 'craft',
      title: 'Artisanal Craftsmanship',
      subtitle: 'The patience of luxury extraction',
      description: 'Our fragrances are formulated in Grasse and hand-poured in small batches in our laboratory. We allow each formulation to mature for a minimum of twelve weeks, permitting the base, heart, and head notes to achieve a harmonious and complex marriage.',
      imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&auto=format&fit=crop'
    },
    {
      id: 'sourcing',
      title: 'Rare Ingredients',
      subtitle: 'Ethical sourcing across the continents',
      description: 'We travel worldwide to source ingredients of unparalleled quality. From wild-harvested Agarwood (Oud) in the rainforests of East Kalimantan to hand-picked Damascus Roses in Bulgaria\'s Rose Valley, every absolute is ethically and sustainably gathered.',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop'
    },
    {
      id: 'essence',
      title: 'Olfactory Balance',
      subtitle: 'Designing modern complex signatures',
      description: 'Rather than focusing on linear scents, our master perfumers design complex architectural olfactory pyramids. AURA perfumes evolve dynamically on the skin, reacting to warmth and chemistry to reveal unique notes over the course of hours.',
      imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop'
    }
  ];

  selectPillar(id: string) {
    this.activePillar.set(id);
  }

  getActivePillarData(): BrandPillar {
    return this.pillars.find(p => p.id === this.activePillar()) || this.pillars[0];
  }
}
