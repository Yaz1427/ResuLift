export type PlanType = 'free' | 'basic' | 'premium'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  credits: number
  plan: PlanType
  avatar_url: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  user_id: string
  type: 'basic' | 'premium'
  status: AnalysisStatus
  resume_url: string
  resume_filename: string
  job_title: string | null
  job_company: string | null
  job_description: string
  target_country: string | null
  seniority_level: string | null
  ats_score: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any | null
  created_at: string
  completed_at: string | null
}

export interface Payment {
  id: string
  user_id: string
  analysis_id: string | null
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      analyses: {
        Row: Analysis
        Insert: Omit<Analysis, 'id' | 'created_at' | 'completed_at'>
        Update: Partial<Omit<Analysis, 'id' | 'user_id' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
    }
  }
}
