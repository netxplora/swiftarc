export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          company: string | null;
          contact_name: string;
          country_code: string;
          created_at: string;
          email: string | null;
          id: string;
          is_default_recipient: boolean;
          is_default_sender: boolean;
          label: string;
          lat: number | null;
          line1: string;
          line2: string | null;
          lng: number | null;
          phone: string | null;
          postal_code: string;
          region: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city: string;
          company?: string | null;
          contact_name: string;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_default_recipient?: boolean;
          is_default_sender?: boolean;
          label: string;
          lat?: number | null;
          line1: string;
          line2?: string | null;
          lng?: number | null;
          phone?: string | null;
          postal_code: string;
          region?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          company?: string | null;
          contact_name?: string;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_default_recipient?: boolean;
          is_default_sender?: boolean;
          label?: string;
          lat?: number | null;
          line1?: string;
          line2?: string | null;
          lng?: number | null;
          phone?: string | null;
          postal_code?: string;
          region?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor: string;
          actor_id: string | null;
          created_at: string;
          details: Json | null;
          id: string;
          ip: string | null;
          severity: string;
          target: string | null;
        };
        Insert: {
          action: string;
          actor: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip?: string | null;
          severity?: string;
          target?: string | null;
        };
        Update: {
          action?: string;
          actor?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip?: string | null;
          severity?: string;
          target?: string | null;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string;
          status: string;
          subject: string | null;
          updated_at: string;
          user_id: string | null;
          guest_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
          user_id?: string | null;
          guest_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
          user_id?: string | null;
          guest_id?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string | null;
          sender_role: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string | null;
          sender_role?: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string | null;
          sender_role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      cms_pages: {
        Row: {
          author: string;
          content: string;
          created_at: string;
          id: string;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          views: number;
        };
        Insert: {
          author: string;
          content?: string;
          created_at?: string;
          id?: string;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          views?: number;
        };
        Update: {
          author?: string;
          content?: string;
          created_at?: string;
          id?: string;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          views?: number;
        };
        Relationships: [];
      };
      customs_holds: {
        Row: {
          amount_due: number | null;
          charge_category: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          customs_authority: string | null;
          customs_location_id: string | null;
          deadline: string | null;
          declared_goods: string | null;
          hold_date: string;
          hold_reason: string;
          id: string;
          notes: string | null;
          payer_user_id: string | null;
          payment_responsibility: string | null;
          payment_transaction_id: string | null;
          required_action: string | null;
          required_documents: string | null;
          shipment_id: string;
          status: string;
          supporting_documents: Json | null;
          tracking_number: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          amount_due?: number | null;
          charge_category?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          customs_authority?: string | null;
          customs_location_id?: string | null;
          deadline?: string | null;
          declared_goods?: string | null;
          hold_date?: string;
          hold_reason: string;
          id?: string;
          notes?: string | null;
          payer_user_id?: string | null;
          payment_responsibility?: string | null;
          payment_transaction_id?: string | null;
          required_action?: string | null;
          required_documents?: string | null;
          shipment_id: string;
          status?: string;
          supporting_documents?: Json | null;
          tracking_number: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          amount_due?: number | null;
          charge_category?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          customs_authority?: string | null;
          customs_location_id?: string | null;
          deadline?: string | null;
          declared_goods?: string | null;
          hold_date?: string;
          hold_reason?: string;
          id?: string;
          notes?: string | null;
          payer_user_id?: string | null;
          payment_responsibility?: string | null;
          payment_transaction_id?: string | null;
          required_action?: string | null;
          required_documents?: string | null;
          shipment_id?: string;
          status?: string;
          supporting_documents?: Json | null;
          tracking_number?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customs_holds_customs_location_id_fkey";
            columns: ["customs_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customs_holds_payment_transaction_id_fkey";
            columns: ["payment_transaction_id"];
            isOneToOne: false;
            referencedRelation: "payment_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customs_holds_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      digital_currency_wallets: {
        Row: {
          asset_name: string;
          asset_symbol: string;
          balance: number | null;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
          wallet_address: string | null;
        };
        Insert: {
          asset_name: string;
          asset_symbol: string;
          balance?: number | null;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
          wallet_address?: string | null;
        };
        Update: {
          asset_name?: string;
          asset_symbol?: string;
          balance?: number | null;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          created_at: string;
          deliveries: number;
          email: string;
          id: string;
          joined_at: string;
          name: string;
          rating: number;
          status: string;
          updated_at: string;
          user_id: string | null;
          zone: string;
        };
        Insert: {
          created_at?: string;
          deliveries?: number;
          email: string;
          id?: string;
          joined_at?: string;
          name: string;
          rating?: number;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          zone?: string;
        };
        Update: {
          created_at?: string;
          deliveries?: number;
          email?: string;
          id?: string;
          joined_at?: string;
          name?: string;
          rating?: number;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          zone?: string;
        };
        Relationships: [];
      };
      fleet_vehicles: {
        Row: {
          created_at: string;
          driver_id: string | null;
          fuel_level: number;
          id: string;
          location: string;
          mileage: number;
          model: string;
          next_service_date: string | null;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          driver_id?: string | null;
          fuel_level?: number;
          id?: string;
          location?: string;
          mileage?: number;
          model: string;
          next_service_date?: string | null;
          status?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string | null;
          fuel_level?: number;
          id?: string;
          location?: string;
          mileage?: number;
          model?: string;
          next_service_date?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_vehicles_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      grant_applications: {
        Row: {
          admin_feedback: string | null;
          application_number: string;
          created_at: string | null;
          documents: Json | null;
          grant_program_id: string;
          id: string;
          project_title: string;
          proposal_summary: string;
          requested_amount: number;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          admin_feedback?: string | null;
          application_number: string;
          created_at?: string | null;
          documents?: Json | null;
          grant_program_id: string;
          id?: string;
          project_title: string;
          proposal_summary: string;
          requested_amount: number;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          admin_feedback?: string | null;
          application_number?: string;
          created_at?: string | null;
          documents?: Json | null;
          grant_program_id?: string;
          id?: string;
          project_title?: string;
          proposal_summary?: string;
          requested_amount?: number;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grant_applications_grant_program_id_fkey";
            columns: ["grant_program_id"];
            isOneToOne: false;
            referencedRelation: "grant_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      grant_programs: {
        Row: {
          category: string;
          created_at: string | null;
          deadline: string | null;
          description: string;
          eligibility_criteria: string;
          funding_amount: number;
          id: string;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          deadline?: string | null;
          description: string;
          eligibility_criteria: string;
          funding_amount: number;
          id?: string;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          deadline?: string | null;
          description?: string;
          eligibility_criteria?: string;
          funding_amount?: number;
          id?: string;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      hs_codes: {
        Row: {
          category: string;
          code: string;
          description: string;
        };
        Insert: {
          category: string;
          code: string;
          description: string;
        };
        Update: {
          category?: string;
          code?: string;
          description?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          created_at: string;
          currency: string;
          due_date: string;
          id: string;
          issue_date: string;
          line_items: Json;
          number: string;
          shipment_id: string | null;
          status: string;
          subtotal: number;
          tax: number;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          due_date?: string;
          id?: string;
          issue_date?: string;
          line_items?: Json;
          number: string;
          shipment_id?: string | null;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          due_date?: string;
          id?: string;
          issue_date?: string;
          line_items?: Json;
          number?: string;
          shipment_id?: string | null;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          address: string | null;
          city: string;
          contact_email: string | null;
          contact_phone: string | null;
          country: string;
          created_at: string;
          id: string;
          is_active: boolean;
          is_customs_facility: boolean;
          is_distribution_hub: boolean;
          lat: number | null;
          lng: number | null;
          name: string;
          notes: string | null;
          operational_hours: string | null;
          postal_code: string | null;
          state: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          country: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_customs_facility?: boolean;
          is_distribution_hub?: boolean;
          lat?: number | null;
          lng?: number | null;
          name: string;
          notes?: string | null;
          operational_hours?: string | null;
          postal_code?: string | null;
          state?: string | null;
          type?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_customs_facility?: boolean;
          is_distribution_hub?: boolean;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          notes?: string | null;
          operational_hours?: string | null;
          postal_code?: string | null;
          state?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          category: string;
          created_at: string;
          id: string;
          read: boolean;
          title: string;
          tone: string;
          user_id: string;
        };
        Insert: {
          body: string;
          category?: string;
          created_at?: string;
          id?: string;
          read?: boolean;
          title: string;
          tone?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          category?: string;
          created_at?: string;
          id?: string;
          read?: boolean;
          title?: string;
          tone?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          created_at: string;
          description: string | null;
          enabled: boolean;
          id: string;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id?: string;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          admin_note: string | null;
          amount: number;
          bank_reference: string | null;
          card_last4: string | null;
          charge_type: string | null;
          created_at: string;
          created_by: string | null;
          crypto_address: string | null;
          crypto_amount: string | null;
          crypto_currency: string | null;
          crypto_network: string | null;
          currency: string;
          customs_hold_id: string | null;
          expires_at: string | null;
          id: string;
          method: string;
          payer_name: string | null;
          payment_deadline: string | null;
          payment_responsibility: string | null;
          reference: string;
          shipment_id: string;
          status: string;
          supporting_reason: string | null;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
          wallet_id: string | null;
        };
        Insert: {
          admin_note?: string | null;
          amount: number;
          bank_reference?: string | null;
          card_last4?: string | null;
          charge_type?: string | null;
          created_at?: string;
          created_by?: string | null;
          crypto_address?: string | null;
          crypto_amount?: string | null;
          crypto_currency?: string | null;
          crypto_network?: string | null;
          currency?: string;
          customs_hold_id?: string | null;
          expires_at?: string | null;
          id?: string;
          method: string;
          payer_name?: string | null;
          payment_deadline?: string | null;
          payment_responsibility?: string | null;
          reference: string;
          shipment_id: string;
          status?: string;
          supporting_reason?: string | null;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
          wallet_id?: string | null;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          bank_reference?: string | null;
          card_last4?: string | null;
          charge_type?: string | null;
          created_at?: string;
          created_by?: string | null;
          crypto_address?: string | null;
          crypto_amount?: string | null;
          crypto_currency?: string | null;
          crypto_network?: string | null;
          currency?: string;
          customs_hold_id?: string | null;
          expires_at?: string | null;
          id?: string;
          method?: string;
          payer_name?: string | null;
          payment_deadline?: string | null;
          payment_responsibility?: string | null;
          reference?: string;
          shipment_id?: string;
          status?: string;
          supporting_reason?: string | null;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          wallet_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_customs_hold_id_fkey";
            columns: ["customs_hold_id"];
            isOneToOne: false;
            referencedRelation: "customs_holds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
        ];
      };
      pickups: {
        Row: {
          address: string;
          city: string;
          company: string | null;
          contact_name: string;
          created_at: string;
          id: string;
          instructions: string | null;
          package_count: number;
          pickup_date: string;
          postal_code: string;
          reference: string;
          slot: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          address: string;
          city: string;
          company?: string | null;
          contact_name: string;
          created_at?: string;
          id?: string;
          instructions?: string | null;
          package_count?: number;
          pickup_date: string;
          postal_code: string;
          reference: string;
          slot: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string;
          city?: string;
          company?: string | null;
          contact_name?: string;
          created_at?: string;
          id?: string;
          instructions?: string | null;
          package_count?: number;
          pickup_date?: string;
          postal_code?: string;
          reference?: string;
          slot?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          base_fee: number;
          carbon_offset_per_km_kg: number;
          hazmat_surcharge: number;
          id: string;
          insurance_rate: number;
          per_kg_rate: number;
          per_km_rate: number;
          signature_fee: number;
          surge_multiplier: number;
          tax_rate: number;
          updated_at: string;
          updated_by: string | null;
          vehicle_rates: Json;
          zone_multipliers: Json;
        };
        Insert: {
          base_fee?: number;
          carbon_offset_per_km_kg?: number;
          hazmat_surcharge?: number;
          id?: string;
          insurance_rate?: number;
          per_kg_rate?: number;
          per_km_rate?: number;
          signature_fee?: number;
          surge_multiplier?: number;
          tax_rate?: number;
          updated_at?: string;
          updated_by?: string | null;
          vehicle_rates?: Json;
          zone_multipliers?: Json;
        };
        Update: {
          base_fee?: number;
          carbon_offset_per_km_kg?: number;
          hazmat_surcharge?: number;
          id?: string;
          insurance_rate?: number;
          per_kg_rate?: number;
          per_km_rate?: number;
          signature_fee?: number;
          surge_multiplier?: number;
          tax_rate?: number;
          updated_at?: string;
          updated_by?: string | null;
          vehicle_rates?: Json;
          zone_multipliers?: Json;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          notif_email: boolean;
          notif_marketing: boolean;
          notif_push: boolean;
          notif_sms: boolean;
          theme: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          notif_email?: boolean;
          notif_marketing?: boolean;
          notif_push?: boolean;
          notif_sms?: boolean;
          theme?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          notif_email?: boolean;
          notif_marketing?: boolean;
          notif_push?: boolean;
          notif_sms?: boolean;
          theme?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          endpoint: string;
          id: string;
          request_time: string | null;
          user_id: string;
        };
        Insert: {
          endpoint: string;
          id?: string;
          request_time?: string | null;
          user_id: string;
        };
        Update: {
          endpoint?: string;
          id?: string;
          request_time?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          file_data: Json | null;
          id: string;
          name: string;
          period: string;
          size_bytes: number | null;
          status: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          created_by?: string | null;
          file_data?: Json | null;
          id?: string;
          name: string;
          period: string;
          size_bytes?: number | null;
          status?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          file_data?: Json | null;
          id?: string;
          name?: string;
          period?: string;
          size_bytes?: number | null;
          status?: string;
        };
        Relationships: [];
      };
      shipment_events: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          location: string | null;
          occurred_at: string;
          shipment_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          location?: string | null;
          occurred_at?: string;
          shipment_id: string;
          status: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          location?: string | null;
          occurred_at?: string;
          shipment_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipment_services: {
        Row: {
          created_at: string;
          description: string | null;
          estimated_days_max: number | null;
          estimated_days_min: number | null;
          id: string;
          is_active: boolean;
          is_international: boolean;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          estimated_days_max?: number | null;
          estimated_days_min?: number | null;
          id?: string;
          is_active?: boolean;
          is_international?: boolean;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          estimated_days_max?: number | null;
          estimated_days_min?: number | null;
          id?: string;
          is_active?: boolean;
          is_international?: boolean;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          ai_delay_reason: string | null;
          ai_delay_risk: number | null;
          assigned_courier_id: string | null;
          created_at: string;
          created_by: string | null;
          customs_info: Json | null;
          declared_value: number;
          destination: Json;
          estimated_delivery: string | null;
          id: string;
          insurance: boolean;
          is_hazmat: boolean;
          notes: string | null;
          origin: Json;
          package: Json;
          proof_of_delivery: Json | null;
          receiver_info: Json | null;
          route_stops: Json | null;
          service: string;
          signature_required: boolean;
          status: string;
          telemetry: Json | null;
          tracking_number: string;
          updated_at: string;
          user_id: string;
          verification_notes: string | null;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
          volumetric_weight: number | null;
        };
        Insert: {
          ai_delay_reason?: string | null;
          ai_delay_risk?: number | null;
          assigned_courier_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customs_info?: Json | null;
          declared_value?: number;
          destination: Json;
          estimated_delivery?: string | null;
          id?: string;
          insurance?: boolean;
          is_hazmat?: boolean;
          notes?: string | null;
          origin: Json;
          package: Json;
          proof_of_delivery?: Json | null;
          receiver_info?: Json | null;
          route_stops?: Json | null;
          service: string;
          signature_required?: boolean;
          status?: string;
          telemetry?: Json | null;
          tracking_number: string;
          updated_at?: string;
          user_id: string;
          verification_notes?: string | null;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          volumetric_weight?: number | null;
        };
        Update: {
          ai_delay_reason?: string | null;
          ai_delay_risk?: number | null;
          assigned_courier_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customs_info?: Json | null;
          declared_value?: number;
          destination?: Json;
          estimated_delivery?: string | null;
          id?: string;
          insurance?: boolean;
          is_hazmat?: boolean;
          notes?: string | null;
          origin?: Json;
          package?: Json;
          proof_of_delivery?: Json | null;
          receiver_info?: Json | null;
          route_stops?: Json | null;
          service?: string;
          signature_required?: boolean;
          status?: string;
          telemetry?: Json | null;
          tracking_number?: string;
          updated_at?: string;
          user_id?: string;
          verification_notes?: string | null;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          volumetric_weight?: number | null;
        };
        Relationships: [];
      };
      swap_fee_settings: {
        Row: {
          flat_fee: number | null;
          id: string;
          max_fee: number | null;
          min_fee: number | null;
          percentage_fee: number | null;
          promotional_discount: number | null;
          updated_at: string | null;
        };
        Insert: {
          flat_fee?: number | null;
          id?: string;
          max_fee?: number | null;
          min_fee?: number | null;
          percentage_fee?: number | null;
          promotional_discount?: number | null;
          updated_at?: string | null;
        };
        Update: {
          flat_fee?: number | null;
          id?: string;
          max_fee?: number | null;
          min_fee?: number | null;
          percentage_fee?: number | null;
          promotional_discount?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      tax_refund_applications: {
        Row: {
          admin_notes: string | null;
          application_number: string;
          created_at: string | null;
          documents: Json | null;
          estimated_refund_amount: number;
          filing_status: string | null;
          id: string;
          status: string | null;
          tax_year: number;
          updated_at: string | null;
          user_id: string;
          user_notes: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          application_number: string;
          created_at?: string | null;
          documents?: Json | null;
          estimated_refund_amount: number;
          filing_status?: string | null;
          id?: string;
          status?: string | null;
          tax_year: number;
          updated_at?: string | null;
          user_id: string;
          user_notes?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          application_number?: string;
          created_at?: string | null;
          documents?: Json | null;
          estimated_refund_amount?: number;
          filing_status?: string | null;
          id?: string;
          status?: string | null;
          tax_year?: number;
          updated_at?: string | null;
          user_id?: string;
          user_notes?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          address: string;
          created_at: string;
          currency: string;
          id: string;
          instructions: string | null;
          label: string | null;
          network: string;
          qr_code_url: string | null;
          sort_order: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          currency: string;
          id?: string;
          instructions?: string | null;
          label?: string | null;
          network: string;
          qr_code_url?: string | null;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          instructions?: string | null;
          label?: string | null;
          network?: string;
          qr_code_url?: string | null;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string;
          p_max_requests: number;
          p_user_id: string;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      create_shipment_with_payment:
        | {
            Args: {
              p_declared_value: number;
              p_destination: Json;
              p_estimated_delivery: string;
              p_insurance: boolean;
              p_is_hazmat?: boolean;
              p_notes: string;
              p_origin: Json;
              p_package: Json;
              p_service: string;
              p_signature_required: boolean;
              p_total_amount: number;
              p_user_id: string;
              p_volumetric_weight?: number;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_customs_info?: Json;
              p_declared_value: number;
              p_destination: Json;
              p_estimated_delivery: string;
              p_insurance: boolean;
              p_is_hazmat?: boolean;
              p_notes: string;
              p_origin: Json;
              p_package: Json;
              p_service: string;
              p_signature_required: boolean;
              p_total_amount: number;
              p_user_id: string;
              p_volumetric_weight?: number;
            };
            Returns: Json;
          };
      get_pickup_slot_counts: {
        Args: { target_date: string };
        Returns: {
          cnt: number;
          slot: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
