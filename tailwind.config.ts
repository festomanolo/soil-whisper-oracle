
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// AgriOracle custom colors
				soil: {
					DEFAULT: '#5D4037',
					dark: '#3E2723',
					light: '#8D6E63',
				},
				foliage: {
					DEFAULT: '#2E7D32',
					dark: '#1B5E20',
					light: '#4CAF50',
				},
				nutrient: {
					nitrogen: '#388E3C',
					phosphorus: '#1976D2',
					potassium: '#FFA000',
					oxygen: '#29B6F6',
					ph: {
						acidic: '#F44336',
						neutral: '#9E9E9E',
						alkaline: '#673AB7',
					},
				},
				moisture: {
					dry: '#D84315',
					moist: '#0288D1',
					wet: '#01579B',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"soil-particle-float": {
					"0%, 100%": { transform: "translateY(0) translateX(0)" },
					"25%": { transform: "translateY(-5px) translateX(3px)" },
					"50%": { transform: "translateY(-8px) translateX(-2px)" },
					"75%": { transform: "translateY(-3px) translateX(-5px)" },
				},
				"pulse-ring": {
					"0%": { transform: "scale(0.95)", opacity: "1" },
					"70%": { transform: "scale(1.1)", opacity: "0.3" },
					"100%": { transform: "scale(0.95)", opacity: "1" },
				},
				"data-pulse": {
					"0%": { opacity: "0.4" },
					"50%": { opacity: "1" },
					"100%": { opacity: "0.4" },
				},
				"fade-in-up": {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"soil-particle": "soil-particle-float 6s ease-in-out infinite",
				"soil-particle-slow": "soil-particle-float 9s ease-in-out infinite",
				"pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"data-pulse": "data-pulse 2s ease-in-out infinite",
				"fade-in-up": "fade-in-up 0.6s ease-out",
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-soil': 'linear-gradient(to bottom, #3E2723, #5D4037)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
