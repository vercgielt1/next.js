use turbo_tasks::Vc;
use turbopack::{
    module_options::{ModuleRule, ModuleRuleEffect, ModuleType, RuleCondition},
    transition::Transition,
};
use turbopack_core::reference_type::{CssReferenceSubType, ReferenceType};

use super::css_client_reference_module_type::CssClientReferenceModuleType;

pub(crate) fn get_next_css_client_reference_transforms_rule(
    client_transition: Vc<Box<dyn Transition>>,
) -> ModuleRule {
    let module_type = CssClientReferenceModuleType::new(client_transition);

    ModuleRule::new_internal(
        // Override the default module type for CSS assets. Instead, they will go through the
        // custom CSS client reference module type, which will:
        // 1. Chunk them through the client chunking context.
        // 2. Propagate them to the client references manifest.
        RuleCondition::all(vec![RuleCondition::ReferenceType(ReferenceType::Css(
            CssReferenceSubType::Internal,
        ))]),
        vec![ModuleRuleEffect::ModuleType(ModuleType::Custom(
            Vc::upcast(module_type),
        ))],
    )
}
